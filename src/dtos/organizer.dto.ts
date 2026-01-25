import z from "zod";
import {
  createOrganizerSchema,
  updateOrganizerSchema,
} from "../types/organizer.type";

export type CreateOrganizerDto = z.infer<typeof createOrganizerSchema>;
export type UpdateOrganizerDto = z.infer<typeof updateOrganizerSchema>;

export interface OrganizerResponseDto {
  id: string;
  userId: string;
  organizationName: string;
  profilePicture?: string;
  bio?: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  website?: string;
  photos: string[];
  videos: string[];
  organizationType: string;
  eventTypes: string[];
  verificationDocuments?: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
