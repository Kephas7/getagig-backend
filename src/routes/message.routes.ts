import { Router } from "express";
import { MessageController } from "../controllers/message.controller";
import { authorizedMiddleWare } from "../middlewares/authorized.middleware";

const router = Router();
const messageController = new MessageController();

router.use(authorizedMiddleWare);

router.get("/conversations", messageController.getConversations);
router.get("/conversations/:conversationId", messageController.getMessages);
router.post("/conversations/start", messageController.startConversation);
router.post("/send", messageController.sendMessage);

export default router;
