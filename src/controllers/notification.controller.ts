import { Request, Response, NextFunction } from "express";
import { NotificationModel } from "../models/notification.model";

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const userId = user._id ? user._id.toString() : user.id || user.userId;

      const notifications = await NotificationModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50); // Get latest 50 notifications

      const unreadCount = await NotificationModel.countDocuments({
        userId,
        isRead: false,
      });

      res.status(200).json({
        success: true,
        data: notifications,
        unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const userId = user._id ? user._id.toString() : user.id || user.userId;
      const notificationId = req.params.id;

      let result;

      if (notificationId === "all") {
        // Mark all as read
        result = await NotificationModel.updateMany(
          { userId, isRead: false },
          { $set: { isRead: true } },
        );
      } else {
        // Mark single notification as read
        result = await NotificationModel.findOneAndUpdate(
          { _id: notificationId, userId },
          { $set: { isRead: true } },
          { new: true },
        );
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
