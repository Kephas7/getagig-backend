// src/middleware/upload.middleware.ts

import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    "uploads/musicians/photos",
    "uploads/musicians/videos",
    "uploads/musicians/audio",
    "uploads/musicians/profile",
    "uploads/organizers/photos",
    "uploads/organizers/videos",
    "uploads/organizers/documents",
    "uploads/organizers/profile",
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Helper function to determine user type from request
const getUserType = (req: Request): "musicians" | "organizers" => {
  // Check originalUrl first (this contains the full route)
  const url = req.originalUrl || req.url || req.path || "";

  if (url.includes("/organizers") || url.includes("/organizer")) {
    return "organizers";
  }

  return "musicians";
};

// Helper function to determine folder based on file characteristics
const getFolderFromFile = (
  fieldname: string,
  mimetype: string,
  originalname: string,
): string => {
  // Check field name first
  if (fieldname === "profilePicture") {
    return "profile";
  } else if (fieldname === "verificationDocuments") {
    return "documents";
  }

  // Check mimetype
  if (mimetype.startsWith("video/")) {
    return "videos";
  } else if (mimetype.startsWith("audio/")) {
    return "audio";
  } else if (mimetype.startsWith("image/")) {
    return "photos";
  }

  // Check file extension as fallback (important for Flutter/mobile clients)
  const ext = path.extname(originalname).toLowerCase();
  const videoExts = [
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
    ".m4v",
    ".flv",
    ".wmv",
    ".3gp",
  ];
  const audioExts = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".wma"];
  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
  const docExts = [".pdf", ".doc", ".docx", ".txt"];

  if (videoExts.includes(ext)) {
    return "videos";
  } else if (audioExts.includes(ext)) {
    return "audio";
  } else if (imageExts.includes(ext)) {
    return "photos";
  } else if (docExts.includes(ext)) {
    return "documents";
  }

  // Default to photos if unable to determine
  return "photos";
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userType = getUserType(req);
    const folder = getFolderFromFile(
      file.fieldname,
      file.mimetype,
      file.originalname,
    );
    const finalPath = `uploads/${userType}/${folder}`;

    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename using UUID
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueId}${ext}`;

    cb(null, filename);
  },
});

// File filter with extended support for Flutter/mobile clients
const fileFilter = (req: any, file: any, cb: any) => {
  // Allowed file types with extended format support
  const imageTypes = /jpeg|jpg|png|gif|webp|bmp|svg/;
  const videoTypes = /mp4|mov|avi|mkv|webm|m4v|flv|wmv|3gp/;
  const audioTypes = /mp3|wav|ogg|m4a|aac|flac|wma/;
  const documentTypes = /pdf|doc|docx|jpg|jpeg|png|txt/;

  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  // Determine expected type based on field name
  const fieldname = file.fieldname;

  if (fieldname === "profilePicture" || fieldname === "photos") {
    // Accept both by extension and mimetype to support mobile clients
    if (imageTypes.test(ext.slice(1)) || mimetype.startsWith("image/")) {
      return cb(null, true);
    }
  } else if (fieldname === "videos") {
    if (videoTypes.test(ext.slice(1)) || mimetype.startsWith("video/")) {
      return cb(null, true);
    }
  } else if (fieldname === "audioSamples") {
    if (audioTypes.test(ext.slice(1)) || mimetype.startsWith("audio/")) {
      return cb(null, true);
    }
  } else if (fieldname === "verificationDocuments") {
    if (documentTypes.test(ext.slice(1))) {
      return cb(null, true);
    }
  }

  // Fallback: accept based on mimetype alone for maximum compatibility
  const mimetypeCheck =
    mimetype.startsWith("image/") ||
    mimetype.startsWith("video/") ||
    mimetype.startsWith("audio/") ||
    mimetype === "application/pdf";

  if (mimetypeCheck) {
    return cb(null, true);
  }

  cb(new Error(`Invalid file type for ${file.fieldname}.`));
};

// Upload configurations
export const uploadSingle = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for profile picture
  },
  fileFilter: fileFilter,
}).single("profilePicture");

export const uploadPhotos = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per photo
  },
  fileFilter: fileFilter,
}).array("photos", 20); // Max 20 photos

export const uploadVideos = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per video
  },
  fileFilter: fileFilter,
}).array("videos", 10); // Max 10 videos

export const uploadAudio = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per audio
  },
  fileFilter: fileFilter,
}).array("audioSamples", 10); // Max 10 audio files

export const uploadDocuments = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per document
  },
  fileFilter: fileFilter,
}).array("verificationDocuments", 5); // Max 5 documents

// Multiple fields upload (for creating profile with all media at once)
export const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: fileFilter,
}).fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "photos", maxCount: 20 },
  { name: "videos", maxCount: 10 },
  { name: "audioSamples", maxCount: 10 },
  { name: "verificationDocuments", maxCount: 5 },
]);

// Helper function to get file URL - compatible with both Flutter and Web
export const getFileUrl = (req: any, filepath: string): string => {
  // Return relative path for compatibility with both Flutter and Web
  return `/${filepath.replace(/\\/g, "/")}`;
};

// Helper function to delete file
export const deleteFile = (filepath: string): void => {
  if (!filepath) {
    return;
  }

  // Remove the domain part if it exists
  let cleanPath = filepath;

  // Handle various URL formats
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    cleanPath = cleanPath.replace(/^https?:\/\/[^/]+\//, "");
  }

  // Remove leading slash if present
  if (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.slice(1);
  }

  try {
    if (fs.existsSync(cleanPath)) {
      fs.unlinkSync(cleanPath);
      console.log(`✅ File deleted: ${cleanPath}`);
    } else {
      console.log(
        `⚠️  File not found for deletion: ${cleanPath} (original: ${filepath})`,
      );
    }
  } catch (error) {
    console.error(`❌ Error deleting file ${cleanPath}:`, error);
  }
};
