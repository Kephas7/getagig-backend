import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { HttpError } from "../errors/http-error";
import { IUser } from "../models/user.model";
import { getFileUrl, deleteFile } from "../middlewares/upload.middleware";
import { ZodError } from "zod";
import {
  LoginUserSchema,
  RegisterUserSchema,
  UpdateUserSchema,
} from "../types/user.type";
import { UpdateUserDto } from "../dtos/user.dto";

export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * POST /api/auth/register
   * Register a new user
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = RegisterUserSchema.parse(req.body);
      const user = await this.userService.registerUser(validatedData);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/login
   * Login user and return JWT token
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = LoginUserSchema.parse(req.body);
      const result = await this.userService.LoginUser(validatedData);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/me
   * Get current authenticated user's information
   */
  getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const userData = await this.userService.getCurrentUser(
        user._id.toString(),
      );

      res.status(200).json({
        success: true,
        data: userData,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/auth/profile/:id
   * Update own profile with optional profile picture
   * Users can only update their own profile
   */
  updateOwnProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const user = req.user as IUser;

      // Security check: Users can only update their own profile
      if (user._id.toString() !== id) {
        if (req.file) {
          deleteFile(getFileUrl(req, req.file.path));
        }
        throw new HttpError(403, "You can only update your own profile");
      }

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
      if (uploadedFilePath) updateData.profilePicture = uploadedFilePath;

      // Validate update data
      const validatedData = UpdateUserSchema.parse(updateData);

      const updatedUser = await this.userService.updateOwnProfile(
        id,
        validatedData,
      );

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      // Clean up uploaded file on any error
      if (req.file) {
        deleteFile(getFileUrl(req, req.file.path));
      }
      next(error);
    }
  };
}