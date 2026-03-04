import { Request, Response, NextFunction } from "express";
import { ConversationModel } from "../models/conversation.model";
import { MessageModel } from "../models/message.model";
import { io } from "../utils/socket";
import { NotificationModel } from "../models/notification.model";
import { UserModel } from "../models/user.model";
import { MusicianModel } from "../models/musician.model";
import { OrganizerModel } from "../models/organizer.model";
import push from "../utils/push";
import { HttpError } from "../errors/http-error";

async function enrichParticipantsWithProfilePictures(participants: any[]) {
  const normalizedParticipants = (participants || []).map(
    (participant: any) => {
      const plain = participant?.toObject
        ? participant.toObject()
        : participant;
      return {
        ...plain,
        _id: (plain?._id || participant?._id || "").toString(),
        profilePicture: plain?.profilePicture || "",
      };
    },
  );

  const missingAvatarUserIds = [
    ...new Set(
      normalizedParticipants
        .filter((participant: any) => !participant.profilePicture)
        .map((participant: any) => participant._id)
        .filter(Boolean),
    ),
  ];

  if (missingAvatarUserIds.length === 0) {
    return normalizedParticipants;
  }

  const [musicianProfiles, organizerProfiles] = await Promise.all([
    MusicianModel.find({ userId: { $in: missingAvatarUserIds } })
      .select("userId profilePicture")
      .lean(),
    OrganizerModel.find({ userId: { $in: missingAvatarUserIds } })
      .select("userId profilePicture")
      .lean(),
  ]);

  const musicianAvatarByUserId = new Map<string, string>();
  for (const profile of musicianProfiles) {
    const avatar = profile?.profilePicture?.toString?.();
    const userId = profile?.userId?.toString?.();
    if (avatar && userId) {
      musicianAvatarByUserId.set(userId, avatar);
    }
  }

  const organizerAvatarByUserId = new Map<string, string>();
  for (const profile of organizerProfiles) {
    const avatar = profile?.profilePicture?.toString?.();
    const userId = profile?.userId?.toString?.();
    if (avatar && userId) {
      organizerAvatarByUserId.set(userId, avatar);
    }
  }

  return normalizedParticipants.map((participant: any) => {
    if (participant.profilePicture) {
      return participant;
    }

    const participantId = participant._id?.toString?.() || "";
    const role = participant.role;

    let fallbackAvatar = "";
    if (role === "musician") {
      fallbackAvatar = musicianAvatarByUserId.get(participantId) || "";
    } else if (role === "organizer") {
      fallbackAvatar = organizerAvatarByUserId.get(participantId) || "";
    } else {
      fallbackAvatar =
        musicianAvatarByUserId.get(participantId) ||
        organizerAvatarByUserId.get(participantId) ||
        "";
    }

    return {
      ...participant,
      profilePicture: fallbackAvatar,
    };
  });
}

export class MessageController {
  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const userId = user._id ? user._id.toString() : user.id || user.userId;

      const conversations = await ConversationModel.find({
        participants: userId,
      })
        .populate("participants", "username email profilePicture role")
        .sort({ updatedAt: -1 });

      const enrichedConversations = await Promise.all(
        conversations.map(async (conversation) => {
          const conversationData = conversation.toObject();
          conversationData.participants =
            await enrichParticipantsWithProfilePictures(
              conversationData.participants || [],
            );
          return conversationData;
        }),
      );

      res.status(200).json({
        success: true,
        data: enrichedConversations,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const userId = user._id ? user._id.toString() : user.id || user.userId;
      const conversationId = req.params.conversationId;

      const conversation = await ConversationModel.findById(conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        return next(new HttpError(403, "Not part of this conversation"));
      }

      const messages = await MessageModel.find({ conversationId }).sort({
        createdAt: 1,
      });

      const populatedConversation = await ConversationModel.findById(
        conversationId,
      ).populate("participants", "username email profilePicture role");

      const enrichedParticipants = await enrichParticipantsWithProfilePictures(
        (populatedConversation?.participants as any[]) || [],
      );

      res.status(200).json({
        success: true,
        data: {
          messages,
          participants: enrichedParticipants,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async startConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const senderId = user._id ? user._id.toString() : user.id || user.userId;
      const { recipientId } = req.body;
      const normalizedRecipientId = recipientId?.toString?.().trim();

      if (!normalizedRecipientId) {
        return next(new HttpError(400, "Recipient ID is required"));
      }

      if (normalizedRecipientId === senderId) {
        return next(
          new HttpError(400, "You cannot start a conversation with yourself"),
        );
      }

      const recipientUser = await UserModel.findById(normalizedRecipientId)
        .select("_id")
        .lean();

      if (!recipientUser) {
        return next(new HttpError(404, "Recipient user not found"));
      }

      // Find existing conversation between the two users (in any order)
      let conversation = await ConversationModel.findOne({
        participants: { $all: [senderId, normalizedRecipientId] },
      });

      // If no conversation exists, create a new one
      if (!conversation) {
        conversation = await ConversationModel.create({
          participants: [senderId, normalizedRecipientId],
        });
      }

      // Populate participant details similar to getConversations
      const populatedConversation = await conversation.populate(
        "participants",
        "username email profilePicture role",
      );

      const conversationData = populatedConversation.toObject();
      conversationData.participants =
        await enrichParticipantsWithProfilePictures(
          conversationData.participants || [],
        );

      res.status(201).json({
        success: true,
        data: conversationData,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const senderId = user._id ? user._id.toString() : user.id || user.userId;
      const { receiverId, content, conversationId } = req.body;

      if (!content || content.trim() === "") {
        return next(new HttpError(400, "Message content cannot be empty"));
      }

      let conversation = null;

      if (conversationId) {
        conversation = await ConversationModel.findById(conversationId);

        if (!conversation) {
          return next(new HttpError(404, "Conversation not found"));
        }

        const isParticipant = conversation.participants.some(
          (participant) => participant.toString() === senderId,
        );

        if (!isParticipant) {
          return next(
            new HttpError(403, "Not authorized to send in this conversation"),
          );
        }
      }

      if (!conversation && receiverId) {
        conversation = await ConversationModel.findOne({
          participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
          conversation = await ConversationModel.create({
            participants: [senderId, receiverId],
            lastMessage: content,
          });
        }
      }

      if (!conversation) {
        return next(
          new HttpError(400, "Valid Receiver or Conversation ID is required"),
        );
      }

      const message = await MessageModel.create({
        conversationId: conversation._id,
        senderId,
        content,
      });

      conversation.lastMessage = content;
      await conversation.save();

      // Emit real-time payload via Socket.IO directly to conversation room and recipient
      const receiver = conversation.participants.find(
        (p) => p.toString() !== senderId,
      );

      // We emit the new message to a specific room if receiver is currently viewing it,
      // and also a generalized message event so push notifications can appear if they're elsewhere.
      io.to(conversation._id.toString()).emit("newMessage", message);
      if (receiver) {
        // Persist notification in DB
        try {
          const sender = await UserModel.findById(senderId).select("username");
          const senderName = (sender as any)?.username || "Someone";

          const notif = await NotificationModel.create({
            userId: receiver,
            type: "new_message",
            title: `New message from ${senderName}`,
            content: message.content,
            // Store the SENDER user ID so clients can start/open the conversation
            relatedId: senderId,
          });

          // Emit a real-time notification payload matching NotificationModel shape
          io.to(receiver.toString()).emit("receiveNotification", notif);

          // Send push via FCM to receiver device tokens (if any)
          const receiverUser =
            await UserModel.findById(receiver).select("deviceTokens");
          const tokens =
            (receiverUser as any)?.deviceTokens
              ?.map((t: any) => t.token)
              .filter(Boolean) || [];
          if (tokens.length > 0) {
            const payload = {
              notification: {
                title: `New message from ${senderName}`,
                body: message.content,
              },
              data: {
                type: "new_message",
                conversationId: conversation._id.toString(),
                messageId: message._id.toString(),
              },
            };

            try {
              await push.sendPushToTokens(tokens, payload);
            } catch (err) {
              console.warn("Failed to send push to receiver:", err);
            }
          }
        } catch (err) {
          console.warn("Failed to persist/send notification:", err);
        }
      }

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
}
