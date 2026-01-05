import { UserService } from "../services/user.service";
import { RegisterUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { Request, Response } from "express";
import z, { success } from "zod";

let userService = new UserService();
export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const pasredData = RegisterUserDTO.safeParse(req.body);
      if (!pasredData.success) {
        return res
          .status(400)
          .json({ success: false, message: z.prettifyError(pasredData.error) });
      }
      const userData: RegisterUserDTO = pasredData.data;
      const newUser = await userService.registerUser(userData);
      return res.status(201).json({
        success: false,
        message: "User registered successfully.",
        data: newUser,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
  async login(req: Request, res: Response) {
    try {
      const pasredData = LoginUserDTO.safeParse(req.body);
      if (!pasredData.success) {
        return res
          .status(400)
          .json({ success: false, message: z.prettifyError(pasredData.error) });
      }
      const loginData: LoginUserDTO = pasredData.data;
      const { token, user } = await userService.LoginUser(loginData);
      return res
        .status(201)
        .json({
          success: true,
          message: "Login Successful.",
          data: user,
          token,
        });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
