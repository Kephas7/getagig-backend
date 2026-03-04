import z from "zod";
import {
  createMusicianSchema,
  createMusicianCalendarEventSchema,
  updateMusicianSchema,
} from "../types/musician.type";

export type CreateMusicianDto = z.infer<typeof createMusicianSchema>;
export type UpdateMusicianDto = z.infer<typeof updateMusicianSchema>;
export type CreateMusicianCalendarEventDto = z.infer<
  typeof createMusicianCalendarEventSchema
>;

export interface MusicianCalendarEventResponseDto {
  id: string;
  title: string;
  date: Date;
  note?: string;
  createdAt: Date;
}

export interface MusicianResponseDto {
  id: string;
  userId: string;
  stageName: string;
  profilePicture?: string;
  bio?: string;
  phone: string;
  location: string;
  genres: string[];
  instruments: string[];
  experienceYears: number;
  hourlyRate?: number;
  photos: string[];
  videos: string[];
  audioSamples: string[];
  isAvailable: boolean;
  isVerified: boolean;
  verificationRequested: boolean;
  createdAt: Date;
  updatedAt: Date;
}
