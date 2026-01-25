import mongoose, { Schema, Document } from "mongoose";

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
  verificationDocuments: string[];
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
    organizationName: {
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
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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
    website: {
      type: String,
    },
    photos: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    organizationType: {
      type: String,
      required: true,
    },
    eventTypes: {
      type: [String],
      required: true,
    },
    verificationDocuments: {
      type: [String],
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

OrganizerSchema.index({ userId: 1 });
OrganizerSchema.index({ "location.city": 1, "location.country": 1 });
OrganizerSchema.index({ organizationType: 1 });
OrganizerSchema.index({ eventTypes: 1 });
OrganizerSchema.index({ isVerified: 1, isActive: 1 });

export const OrganizerModel = mongoose.model<IOrganizer>(
  "Organizer",
  OrganizerSchema,
);
