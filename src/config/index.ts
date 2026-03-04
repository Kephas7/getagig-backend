import dotenv from "dotenv";

dotenv.config({ quiet: process.env.NODE_ENV === "test" });

export const PORT: number = process.env.PORT
  ? parseInt(process.env.PORT)
  : 3000;

export const MONGODB_URI: string =
  process.env.MONGODB_URI || "mongodb://localhost:27017/default_db";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export const JWT_SECRET: string = process.env.JWT_SECRET;
