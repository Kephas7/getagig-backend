import mongoose, { Schema, Document } from "mongoose";

export interface IMusician extends Document {
  userId: mongoose.Types.ObjectId;
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

const MusicianSchema: Schema = new Schema(
  {
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
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
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
  },
  {
    timestamps: true,
  },
);

MusicianSchema.index({ userId: 1 });
MusicianSchema.index({ "location.city": 1, "location.country": 1 });
MusicianSchema.index({ genres: 1 });
MusicianSchema.index({ instruments: 1 });
MusicianSchema.index({ isAvailable: 1 });

export const MusicianModel = mongoose.model<IMusician>(
  "Musician",
  MusicianSchema,
);
