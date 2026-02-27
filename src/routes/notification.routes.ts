import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authorizedMiddleWare } from "../middlewares/authorized.middleware";

const router = Router();
const notificationController = new NotificationController();

router.use(authorizedMiddleWare);

router.get("/", notificationController.getNotifications);
router.put("/:id/read", notificationController.markAsRead);

export default router;
