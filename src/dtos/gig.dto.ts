import z from "zod";
import { createGigSchema, updateGigSchema } from "../types/gig.type";

export type CreateGigDto = z.infer<typeof createGigSchema>;
export type UpdateGigDto = z.infer<typeof updateGigSchema>;

export interface GigResponseDto {
    id: string;
    title: string;
    description: string;
    organizerId: string;
    location: {
        city: string;
        state: string;
        country: string;
    };
    genres: string[];
    instruments: string[];
    payRate: number;
    eventType: string;
    status: string;
    deadline: Date;
    createdAt: Date;
    updatedAt: Date;
}
