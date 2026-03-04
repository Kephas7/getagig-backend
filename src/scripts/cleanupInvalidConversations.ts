import dotenv from "dotenv";
import mongoose from "mongoose";
import { ConversationModel } from "../models/conversation.model";
import { MessageModel } from "../models/message.model";
import { UserModel } from "../models/user.model";

dotenv.config({ quiet: process.env.NODE_ENV === "test" });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/default_db";
const shouldApply = process.argv.includes("--apply");

async function cleanupInvalidConversations() {
  await mongoose.connect(MONGODB_URI);

  const conversations = await ConversationModel.find(
    {},
    { participants: 1 },
  ).lean();

  const participantIdSet = new Set<string>();

  for (const conversation of conversations) {
    for (const participant of conversation.participants || []) {
      participantIdSet.add(participant.toString());
    }
  }

  const participantIds = [...participantIdSet];
  const users = await UserModel.find(
    {
      _id: {
        $in: participantIds
          .filter((id) => mongoose.isValidObjectId(id))
          .map((id) => new mongoose.Types.ObjectId(id)),
      },
    },
    { _id: 1 },
  ).lean();

  const validUserIdSet = new Set(users.map((user) => user._id.toString()));

  const invalidConversations = conversations
    .map((conversation) => {
      const participants = (conversation.participants || []).map(
        (participant) => participant.toString(),
      );
      const invalidParticipants = participants.filter(
        (participantId) => !validUserIdSet.has(participantId),
      );

      return {
        _id: conversation._id,
        participants,
        invalidParticipants,
      };
    })
    .filter((conversation) => conversation.invalidParticipants.length > 0);

  console.log("\nConversation Cleanup Summary");
  console.log(`- Total conversations: ${conversations.length}`);
  console.log(
    `- Conversations with non-User participants: ${invalidConversations.length}`,
  );

  if (invalidConversations.length > 0) {
    console.log("\nSample invalid conversations:");
    invalidConversations.slice(0, 10).forEach((conversation, index) => {
      console.log(
        `${index + 1}. ${conversation._id.toString()} | invalid participants: ${conversation.invalidParticipants.join(", ")}`,
      );
    });

    if (invalidConversations.length > 10) {
      console.log(`...and ${invalidConversations.length - 10} more.`);
    }
  }

  if (!shouldApply) {
    console.log(
      "\nDry run mode only. Re-run with --apply to delete invalid conversations and their messages.",
    );
    await mongoose.disconnect();
    return;
  }

  if (invalidConversations.length === 0) {
    console.log("\nNo invalid conversations found. Nothing to delete.");
    await mongoose.disconnect();
    return;
  }

  const invalidConversationIds = invalidConversations.map(
    (conversation) => conversation._id,
  );

  const deletedMessages = await MessageModel.deleteMany({
    conversationId: { $in: invalidConversationIds },
  });

  const deletedConversations = await ConversationModel.deleteMany({
    _id: { $in: invalidConversationIds },
  });

  console.log("\nCleanup applied successfully.");
  console.log(
    `- Deleted conversations: ${deletedConversations.deletedCount || 0}`,
  );
  console.log(`- Deleted messages: ${deletedMessages.deletedCount || 0}`);

  await mongoose.disconnect();
}

cleanupInvalidConversations()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("\nFailed to cleanup invalid conversations:", error);
    await mongoose.disconnect();
    process.exit(1);
  });
