import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleWare } from "../middlewares/authorized.middleware";
import { uploadUserProfile } from "../middlewares/upload.middleware";

const router = Router();
const authController = new AuthController();


router.post("/register", authController.register);
router.post("/login", authController.login);

router.use(authorizedMiddleWare);

router.get("/me", authController.getCurrentUser);


router.put("/profile/:id", uploadUserProfile, authController.updateOwnProfile);

router.post("/forgot-password", authController.sendResetPasswordEmail);
router.post("/reset-password/:token", authController.resetPassword);

export default router;