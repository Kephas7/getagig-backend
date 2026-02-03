import { Request, Response, NextFunction } from "express";
import { UserService } from "../../services/user.service";
import { getFileUrl, deleteFile } from "../../middlewares/upload.middleware";
import { CreateUserSchema, UpdateUserSchema } from "../../types/user.type";
import { ZodError } from "zod";
import { UpdateUserDto } from "../../dtos/user.dto";

export class AdminUserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * POST /api/admin/users
   * Create a new user with optional profile picture
   */
  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let userData = req.body;
      const uploadedFilePath = req.file
        ? getFileUrl(req, req.file.path)
        : undefined;

      // Validate input data
      const validatedData = CreateUserSchema.parse({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        profilePicture: uploadedFilePath,
      });

      const user = await this.userService.createUserByAdmin(validatedData);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      // Clean up uploaded file on validation or creation error
      if (req.file) {
        deleteFile(getFileUrl(req, req.file.path));
      }
      next(error);
    }
  };

  /**
   * GET /api/admin/users
   * Get all users with pagination
   */
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.userService.getAllUsers(page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/admin/users/:id
   * Get a specific user by ID
   */
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await this.userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/admin/users/:id
   * Update a user with optional profile picture
   */
  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      let userData = req.body;
      const uploadedFilePath = req.file
        ? getFileUrl(req, req.file.path)
        : undefined;

      // Build update object with only provided fields
      const updateData: Partial<UpdateUserDto> = {};

      if (userData.username !== undefined)
        updateData.username = userData.username;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.password !== undefined)
        updateData.password = userData.password;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (uploadedFilePath) updateData.profilePicture = uploadedFilePath;

      // Validate update data
      const validatedData = UpdateUserSchema.parse(updateData);

      const user = await this.userService.updateUserByAdmin(id, validatedData);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      // Clean up uploaded file on any error
      if (req.file) {
        deleteFile(getFileUrl(req, req.file.path));
      }
      next(error);
    }
  };

  /**
   * DELETE /api/admin/users/:id
   * Delete a user and their associated files
   */
  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await this.userService.deleteUserByAdmin(id);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}