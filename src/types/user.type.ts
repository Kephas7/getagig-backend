import { z } from "zod";

export const UserSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["musician", "organizer", "admin"]).default("musician"),
});

export type UserType = z.infer<typeof UserSchema>;
