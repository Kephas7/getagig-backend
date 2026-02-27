import { Request, Response, NextFunction } from "express";
import { ConversationModel } from "../models/conversation.model";
import { MessageModel } from "../models/message.model";
import { io } from "../utils/socket";
import { NotificationModel } from "../models/notification.model";
import { UserModel } from "../models/user.model";
import push from "../utils/push";
import { HttpError } from "../errors/http-error";

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

      res.status(200).json({
        success: true,
        data: conversations,
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

      const populatedConversation = await ConversationModel.findById(conversationId).populate("participants", "username email profilePicture role");

      res.status(200).json({
        success: true,
        data: {
          messages,
          participants: populatedConversation?.participants || []
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

      if (!recipientId) {
        return next(new HttpError(400, "Recipient ID is required"));
      }

      if (recipientId === senderId) {
        return next(
          new HttpError(400, "You cannot start a conversation with yourself"),
        );
      }

      // Find existing conversation between the two users (in any order)
      let conversation = await ConversationModel.findOne({
        participants: { $all: [senderId, recipientId] },
      });

      // If no conversation exists, create a new one
      if (!conversation) {
        conversation = await ConversationModel.create({
          participants: [senderId, recipientId],
        });
      }

      // Populate participant details similar to getConversations
      const populatedConversation = await conversation.populate(
        "participants",
        "username email profilePicture role",
      );

      res.status(201).json({
        success: true,
        data: populatedConversation,
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
