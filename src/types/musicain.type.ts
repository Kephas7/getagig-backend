

import { z } from 'zod';


export const createMusicianSchema = z.object({
  stageName: z.string().min(1, 'Stage name is required').max(100, 'Stage name too long'),
  profilePicture: z.string().url('Invalid URL').optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  location: z.object({
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  genres: z.array(z.string()).min(1, 'At least one genre is required'),
  instruments: z.array(z.string()).min(1, 'At least one instrument is required'),
  experienceYears: z.number().min(0, 'Experience years cannot be negative'),
  hourlyRate: z.number().min(0, 'Hourly rate cannot be negative').optional(),
  photos: z.array(z.string().url('Invalid photo URL')).optional().default([]),
  videos: z.array(z.string().url('Invalid video URL')).optional().default([]),
  audioSamples: z.array(z.string().url('Invalid audio URL')).optional().default([]),
  isAvailable: z.boolean().optional().default(true),
});


export const updateMusicianSchema = z.object({
  stageName: z.string().min(1).max(100).optional(),
  profilePicture: z.string().url('Invalid URL').optional(),
  bio: z.string().max(1000).optional(),
  phone: z.string().min(10).optional(),
  location: z.object({
    city: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
  }).optional(),
  genres: z.array(z.string()).min(1).optional(),
  instruments: z.array(z.string()).min(1).optional(),
  experienceYears: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  photos: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  audioSamples: z.array(z.string().url()).optional(),
  isAvailable: z.boolean().optional(),
});


export type CreateMusicianDto = z.infer<typeof createMusicianSchema>;
export type UpdateMusicianDto = z.infer<typeof updateMusicianSchema>;


export interface MusicianResponseDto {
  id: string;
  userId: string;
  stageName: string;
  profilePicture?: string;
  bio?: string;
  phone: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  genres: string[];
  instruments: string[];
  experienceYears: number;
  hourlyRate?: number;
  photos: string[];
  videos: string[];
  audioSamples: string[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}