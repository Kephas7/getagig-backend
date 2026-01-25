import mongoose, { Schema, Document } from "mongoose";
import { is } from "zod/v4/locales";

export interface IOrganizer extends Document {
  userId: mongoose.Types.ObjectId;
  organizationName: string;
  profilePicture?: string;
  bio?: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  website?: string;
  photos: string[];
  videos: string[];
  organizationType: string;
  eventTypes: string[];
  verificationDocuments?: string[];
  isVerified: boolean;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
const OrganizerSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    organizationName: { type: String, required: true, trim: true },
    profilePicture: { type: String },
    bio: { type: String },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    location: {
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
    },
    website: { type: String },
    photos: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    organizationType: { type: String, required: true, trim: true },
    eventTypes: { type: [String], required: true, default: [] },
    verificationDocuments: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
OrganizerSchema.index({ userId: 1 });
OrganizerSchema.index({ "location.city": 1, "location.country": 1 });

export const OrganizerModel = mongoose.model<IOrganizer>(
  "Organizer",
  OrganizerSchema,
);
