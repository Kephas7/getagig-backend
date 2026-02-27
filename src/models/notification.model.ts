import mongoose, { Schema, Document } from "mongoose";

export type NotificationType =
    | "new_message"
    | "new_application"
    | "application_accepted"
    | "application_rejected"
    | "gig_update"
    | "system";

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    content: string;
    relatedId?: mongoose.Types.ObjectId; // E.g. GigId or ApplicationId
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "new_message",
                "new_application",
                "application_accepted",
                "application_rejected",
                "gig_update",
                "system"
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        relatedId: {
            type: Schema.Types.ObjectId,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index to quickly fetch user's notifications sorted by newest first
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

export const NotificationModel = mongoose.model<INotification>("Notification", NotificationSchema);
