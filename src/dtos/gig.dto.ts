import z from "zod";
import { createGigSchema, updateGigSchema } from "../types/gig.type";

export type CreateGigDto = z.infer<typeof createGigSchema>;
export type UpdateGigDto = z.infer<typeof updateGigSchema>;

export interface GigResponseDto {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizer?: {
    _id: string;
    username: string;
    email: string;
    role: string;
    organizationName?: string;
    profilePicture?: string;
    displayName?: string;
  };
  location: string;
  genres: string[];
  instruments: string[];
  payRate: number;
  eventType: string;
  status: string;
  eventDate: Date;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}
