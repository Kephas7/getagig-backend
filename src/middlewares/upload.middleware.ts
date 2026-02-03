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
const getUserType = (req: Request, role?: string): "musicians" | "organizers" => {
  const url = req.originalUrl || req.url || req.path || "";

  if (url.includes("/organizers") || url.includes("/organizer")) {
    return "organizers";
  }

  // For admin routes, use the provided role parameter
  if (url.includes("/admin/users")) {
    if (role === "organizer") {
      return "organizers";
    }
    return "musicians";
  }

  // For auth update routes, check the user's role
  if (url.includes("/auth/")) {
    const user = (req as any).user;
    if (user && user.role === "organizer") {
      return "organizers";
    }
    return "musicians";
  }

  return "musicians";
};

// Helper function to determine folder based on file characteristics
const getFolderFromFile = (
  fieldname: string,
  mimetype: string,
  originalname: string,
): string => {
  if (fieldname === "profilePicture") {
    return "profile";
  } else if (fieldname === "verificationDocuments") {
    return "documents";
  }

  if (mimetype.startsWith("video/")) {
    return "videos";
  } else if (mimetype.startsWith("audio/")) {
    return "audio";
  } else if (mimetype.startsWith("image/")) {
    return "photos";
  }

  const ext = path.extname(originalname).toLowerCase();
  const videoExts = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".flv", ".wmv", ".3gp"];
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

  return "photos";
};

// Configure storage with access to form fields
const storage = multer.diskStorage({
  destination: (req: any, file, cb) => {
    // Try to get role from various sources - multer provides body through req.body
    // Note: req.body might not be fully populated yet, but multer does make it available
    let role = req.body?.role || req.query?.role || (req.user && req.user.role);
    
    const userType = getUserType(req, role);
    const folder = getFolderFromFile(file.fieldname, file.mimetype, file.originalname);
    const finalPath = `uploads/${userType}/${folder}`;

    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueId}${ext}`;

    cb(null, filename);
  },
});

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
  const imageTypes = /jpeg|jpg|png|gif|webp|bmp|svg/;
  const videoTypes = /mp4|mov|avi|mkv|webm|m4v|flv|wmv|3gp/;
  const audioTypes = /mp3|wav|ogg|m4a|aac|flac|wma/;
  const documentTypes = /pdf|doc|docx|jpg|jpeg|png|txt/;

  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  const fieldname = file.fieldname;

  if (fieldname === "profilePicture" || fieldname === "photos") {
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
}).single("profilePicture");

export const uploadPhotos = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
}).array("photos", 20);

export const uploadVideos = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilter,
}).array("videos", 10);

export const uploadAudio = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: fileFilter,
}).array("audioSamples", 10);

export const uploadDocuments = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter,
}).array("verificationDocuments", 5);

export const uploadMultiple = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilter,
}).fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "photos", maxCount: 20 },
  { name: "videos", maxCount: 10 },
  { name: "audioSamples", maxCount: 10 },
  { name: "verificationDocuments", maxCount: 5 },
]);

export const uploadUserProfile = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter,
}).single("profilePicture");

export const getFileUrl = (req: any, filepath: string): string => {
  return `/${filepath.replace(/\\/g, "/")}`;
};

export const deleteFile = (filepath: string): void => {
  if (!filepath) return;

  let cleanPath = filepath;

  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    cleanPath = cleanPath.replace(/^https?:\/\/[^/]+\//, "");
  }

  if (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.slice(1);
  }

  try {
    if (fs.existsSync(cleanPath)) {
      fs.unlinkSync(cleanPath);
      console.log(`✅ File deleted: ${cleanPath}`);
    } else {
      console.log(`⚠️  File not found for deletion: ${cleanPath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting file ${cleanPath}:`, error);
  }
};