import { z } from "zod";

export const RegisterUserDTO = z
  .object({
    username: z.string().min(2),
    email: z.email(),
    password: z.string().min(6),
    role: z.enum(["musician", "organizer","admin"]).optional(),
  })


export type RegisterUserDTO = z.infer<typeof RegisterUserDTO>;

export const LoginUserDTO = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type LoginUserDTO = z.infer<typeof LoginUserDTO>;
