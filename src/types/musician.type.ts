import { z } from "zod";

export const createMusicianSchema = z.object({
  stageName: z
    .string()
    .min(1, "Stage name is required")
    .max(100, "Stage name too long"),
  profilePicture: z.string().optional(), // Added this field
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  location: z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
  }),
  genres: z.array(z.string()).min(1, "At least one genre is required"),
  instruments: z
    .array(z.string())
    .min(1, "At least one instrument is required"),
  experienceYears: z.number().min(0, "Experience years cannot be negative"),
  hourlyRate: z.number().min(0, "Hourly rate cannot be negative").optional(),
  photos: z.array(z.string()).optional().default([]),
  videos: z.array(z.string()).optional().default([]),
  audioSamples: z.array(z.string()).optional().default([]),
  isAvailable: z.boolean().optional().default(true),
});

export const updateMusicianSchema = z.object({
  stageName: z.string().min(1).max(100).optional(),
  profilePicture: z.string().optional(), // Added this field
  bio: z.string().max(1000).optional(),
  phone: z.string().min(10).optional(),
  location: z
    .object({
      city: z.string().min(1).optional(),
      state: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
    })
    .optional(),
  genres: z.array(z.string()).min(1).optional(),
  instruments: z.array(z.string()).min(1).optional(),
  experienceYears: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  photos: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  audioSamples: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
});