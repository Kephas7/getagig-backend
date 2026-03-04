import mongoose, { Schema, Document } from "mongoose";

export interface IGig extends Document {
  title: string;
  description: string;
  organizerId: mongoose.Types.ObjectId;
  location: string;
  genres: string[];
  instruments: string[];
  payRate: number;
  eventType: string;
  status: "open" | "closed" | "filled";
  eventDate: Date;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GigSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      silent: true,
    },
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: "Organizer",
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    genres: {
      type: [String],
      default: [],
    },
    instruments: {
      type: [String],
      default: [],
    },
    payRate: {
      type: Number,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed", "filled"],
      default: "open",
    },
    deadline: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

GigSchema.index({ organizerId: 1 });
GigSchema.index({ title: "text", description: "text" });
GigSchema.index({ location: 1 });
GigSchema.index({ status: 1 });

export const GigModel = mongoose.model<IGig>("Gig", GigSchema);
