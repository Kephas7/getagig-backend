import mongoose, { Schema, Document } from "mongoose";

export interface IApplication extends Document {
    gigId: mongoose.Types.ObjectId;
    musicianId: mongoose.Types.ObjectId;
    coverLetter?: string;
    status: "pending" | "accepted" | "rejected" | "withdrawn";
    createdAt: Date;
    updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema(
    {
        gigId: {
            type: Schema.Types.ObjectId,
            ref: "Gig",
            required: true,
        },
        musicianId: {
            type: Schema.Types.ObjectId,
            ref: "Musician",
            required: true,
        },
        coverLetter: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "withdrawn"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

// A musician can only apply for a specific gig once
ApplicationSchema.index({ gigId: 1, musicianId: 1 }, { unique: true });
ApplicationSchema.index({ musicianId: 1 });
ApplicationSchema.index({ status: 1 });

export const ApplicationModel = mongoose.model<IApplication>("Application", ApplicationSchema);
