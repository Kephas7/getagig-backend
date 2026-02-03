import { Router } from "express";
import { rolesMiddleWare } from "../../middlewares/roles.middleware";
import { uploadUserProfile } from "../../middlewares/upload.middleware";
import { AdminUserController } from "../../controllers/admin/user.controller";
import { authorizedMiddleWare } from "../../middlewares/authorized.middleware";

const router = Router();
const adminUserController = new AdminUserController();

// All routes require authentication and admin role
router.use(authorizedMiddleWare);
router.use(rolesMiddleWare("admin"));

// POST /api/admin/users - Create user (with optional profile picture)
// Multer now reads role directly from req.body
router.post("/", uploadUserProfile, adminUserController.createUser);

// GET /api/admin/users - Get all users with pagination
router.get("/", adminUserController.getAllUsers);

// GET /api/admin/users/:id - Get user by ID
router.get("/:id", adminUserController.getUserById);

// PUT /api/admin/users/:id - Update user (with optional profile picture)
// Multer now reads role directly from req.body
router.put("/:id", uploadUserProfile, adminUserController.updateUser);

// DELETE /api/admin/users/:id - Delete user
router.delete("/:id", adminUserController.deleteUser);

export default router;