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


  updateOwnProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const user = req.user as IUser;


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


      const updateData: Partial<UpdateUserDto> = {};

      if (userData.username !== undefined)
        updateData.username = userData.username;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.password !== undefined)
        updateData.password = userData.password;
      if (uploadedFilePath) updateData.profilePicture = uploadedFilePath;


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

      if (req.file) {
        deleteFile(getFileUrl(req, req.file.path));
      }
      next(error);
    }
  };
  sendResetPasswordEmail = async (req: Request, res: Response) => {
    try {
      const email = req.body.email;
      const user = await this.userService.sendResetPasswordEmail(email);
      return res.status(200).json(
        {
          success: true,
          data: user,
          message: "If the email is registered, a reset link has been sent."
        }
      );
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json(
        { success: false, message: error.message || "Internal Server Error" }
      );
    }
  };
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.params.token as string;
      const { password } = req.body;
      await this.userService.resetPassword(token, password);
      return res.status(200).json({
        success: true,
        message: "Password reset successful",
      });

    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json(
        { success: false, message: error.message || "Internal Server Error" }
      );
    }
  };
}