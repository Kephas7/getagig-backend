import z from "zod";
import { createMusicianSchema, updateMusicianSchema } from "../types/musicain.type";

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