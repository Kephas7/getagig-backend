import { NotificationModel, NotificationType } from "../models/notification.model";
import { UserModel } from "../models/user.model";
import { io } from "../utils/socket";
import push from "../utils/push";

export class NotificationService {
    async sendNotification(params: {
        userId: string;
        type: NotificationType;
        title: string;
        content: string;
        relatedId?: string;
    }) {
        const { userId, type, title, content, relatedId } = params;
        try {
            // 1. Persist notification in DB
            const notif = await NotificationModel.create({
                userId,
                type,
                title,
                content,
                relatedId,
            });

            // 2. Emit real-time payload via Socket.IO
            io.to(userId).emit("receiveNotification", notif);

            // 3. Send push via FCM
            const user = await UserModel.findById(userId).select("deviceTokens");
            const tokens = (user as any)?.deviceTokens?.map((t: any) => t.token).filter(Boolean) || [];

            if (tokens.length > 0) {
                const payload = {
                    notification: {
                        title,
                        body: content,
                    },
                    data: {
                        type,
                        relatedId: relatedId || "",
                        notificationId: notif._id.toString(),
                    },
                };

                await push.sendPushToTokens(tokens, payload);
            }

            return notif;
        } catch (error) {
            console.error("Failed to send notification:", error);
            // Don't throw error to avoid breaking the main operation
        }
    }
}
