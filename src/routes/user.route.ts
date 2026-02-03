import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleWare } from "../middlewares/authorized.middleware";
import { uploadUserProfile } from "../middlewares/upload.middleware";

const router = Router();
const authController = new AuthController();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes - require authentication
router.use(authorizedMiddleWare);

// GET /api/auth/me - Get current authenticated user
router.get("/me", authController.getCurrentUser);

// PUT /api/auth/profile/:id - Update own profile (with optional profile picture)
// Users can only update their own profile (verified in controller)
// Multer will use the authenticated user's role from req.user
router.put("/profile/:id", uploadUserProfile, authController.updateOwnProfile);

export default router;