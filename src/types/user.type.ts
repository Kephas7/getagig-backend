import { z } from "zod";

export const LoginUserSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const RegisterUserSchema = z
    .object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password is required"),
        role: z.enum(["musician", "organizer", "admin"]),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const CreateUserSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["musician", "organizer", "admin"]),
    profilePicture: z.string().optional(),
});

export const UpdateUserSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters").optional(),
    email: z.string().email("Invalid email address").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    role: z.enum(["musician", "organizer", "admin"]).optional(),
    profilePicture: z.string().optional(),
});
