import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[];
    lastMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        lastMessage: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index participants to quickly find user conversations
ConversationSchema.index({ participants: 1 });

export const ConversationModel = mongoose.model<IConversation>("Conversation", ConversationSchema);
