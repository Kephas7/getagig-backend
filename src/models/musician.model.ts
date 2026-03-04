import mongoose, { Schema, Document } from "mongoose";

export interface IMusician extends Document {
  calendarEvents: Array<{
    _id: mongoose.Types.ObjectId;
    title: string;
    date: Date;
    note?: string;
    createdAt: Date;
  }>;
  userId: mongoose.Types.ObjectId;
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

const MusicianSchema: Schema = new Schema(
  {
    calendarEvents: {
      type: [
        {
          title: {
            type: String,
            required: true,
            trim: true,
          },
          date: {
            type: Date,
            required: true,
          },
          note: {
            type: String,
            trim: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    stageName: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicture: {
      type: String,
    },
    bio: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    genres: {
      type: [String],
      required: true,
    },
    instruments: {
      type: [String],
      required: true,
    },
    experienceYears: {
      type: Number,
      required: true,
    },
    hourlyRate: {
      type: Number,
    },
    photos: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    audioSamples: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationRequested: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

MusicianSchema.index({ location: 1 });
MusicianSchema.index({ genres: 1 });
MusicianSchema.index({ instruments: 1 });
MusicianSchema.index({ isAvailable: 1 });
MusicianSchema.index({ isVerified: 1 });
MusicianSchema.index({ verificationRequested: 1 });

export const MusicianModel = mongoose.model<IMusician>(
  "Musician",
  MusicianSchema,
);
