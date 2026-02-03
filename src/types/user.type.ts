import { z } from "zod";

export const RegisterUserSchema = z.object({
  username: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(["musician", "organizer", "admin"]).optional(),
  profilePicture: z.string().optional(),
});

export const LoginUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const CreateUserSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["musician", "organizer", "admin"]),
  profilePicture: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["musician", "organizer", "admin"]).optional(),

  profilePicture: z.string().optional(),
});
