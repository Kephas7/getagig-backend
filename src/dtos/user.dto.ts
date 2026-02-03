import z from "zod";
import {
  CreateUserSchema,
  LoginUserSchema,
  RegisterUserSchema,
  UpdateUserSchema,
} from "../types/user.type";

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
export type LoginUserDto = z.infer<typeof LoginUserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  role: "musician" | "organizer" | "admin";
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}
