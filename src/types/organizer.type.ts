import { z } from "zod";

export const createOrganizerSchema = z.object({
  organizationName: z
    .string()
    .min(1, "Organization name is required")
    .max(200, "Organization name too long"),
  profilePicture: z.string().url("Invalid URL").optional(),
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters").optional(),
  contactPerson: z
    .string()
    .min(1, "Contact person name is required")
    .max(100, "Name too long"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address"),
  location: z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
  }),
  website: z.string().url("Invalid URL").optional(),
  photos: z.array(z.string().url("Invalid photo URL")).optional().default([]),
  videos: z.array(z.string().url("Invalid video URL")).optional().default([]),
  organizationType: z.string().min(1, "Organization type is required"),
  eventTypes: z.array(z.string()).min(1, "At least one event type is required"),
  verificationDocuments: z
    .array(z.string().url("Invalid document URL"))
    .optional()
    .default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateOrganizerSchema = z.object({
  organizationName: z.string().min(1).max(200).optional(),
  profilePicture: z.string().url("Invalid URL").optional(),
  bio: z.string().max(1000).optional(),
  contactPerson: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email("Invalid email address").optional(),
  location: z
    .object({
      city: z.string().min(1).optional(),
      state: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
    })
    .optional(),
  website: z.string().url("Invalid URL").optional(),
  photos: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  organizationType: z.string().min(1).optional(),
  eventTypes: z.array(z.string()).min(1).optional(),
  verificationDocuments: z.array(z.string().url()).optional(),
  isActive: z.boolean().optional(),
});
