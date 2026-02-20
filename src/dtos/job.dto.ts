import z from "zod";
import { createJobSchema, updateJobSchema } from "../types/job.type";

export type CreateJobDto = z.infer<typeof createJobSchema>;
export type UpdateJobDto = z.infer<typeof updateJobSchema>;

export interface JobResponseDto {
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
