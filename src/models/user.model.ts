import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "musician" | "organizer" | "admin";
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["musician", "organizer", "admin"],
      default: "musician",
    },
    profilePicture: { type: String },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);