import { z } from "zod";

export const createGigSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(10),
    location: z.object({
        city: z.string(),
        state: z.string(),
        country: z.string(),
    }),
    genres: z.array(z.string()).default([]),
    instruments: z.array(z.string()).default([]),
    payRate: z.number().positive(),
    eventType: z.string(),
    deadline: z.string().transform((str) => new Date(str)),
});

export const updateGigSchema = createGigSchema.partial().extend({
    status: z.enum(["open", "closed", "filled"]).optional(),
});
