import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    "uploads/musicians/photos",
    "uploads/musicians/videos",
    "uploads/musicians/audio",
    "uploads/musicians/profile",
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "photos";

    if (file.fieldname === "profilePicture") {
      folder = "profile";
    } else if (file.mimetype.startsWith("video/")) {
      folder = "videos";
    } else if (file.mimetype.startsWith("audio/")) {
      folder = "audio";
    } else if (file.mimetype.startsWith("image/")) {
      folder = "photos";
    }

    cb(null, `uploads/musicians/${folder}`);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  const videoTypes = /mp4|mov|avi|mkv|webm/;
  const audioTypes = /mp3|wav|ogg|m4a|aac/;

  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (file.fieldname === "profilePicture" || file.fieldname === "photos") {
    if (imageTypes.test(ext.slice(1)) && mimetype.startsWith("image/")) {
      return cb(null, true);
    }
  } else if (file.fieldname === "videos") {
    if (videoTypes.test(ext.slice(1)) && mimetype.startsWith("video/")) {
      return cb(null, true);
    }
  } else if (file.fieldname === "audioSamples") {
    if (audioTypes.test(ext.slice(1)) && mimetype.startsWith("audio/")) {
      return cb(null, true);
    }
  }

  cb(
    new Error(
      `Invalid file type for ${file.fieldname}. Allowed: images, videos, or audio based on field.`,
    ),
  );
};

export const uploadSingle = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter,
}).single("profilePicture");

export const uploadPhotos = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter,
}).array("photos", 10);

export const uploadVideos = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: fileFilter,
}).array("videos", 5);

export const uploadAudio = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: fileFilter,
}).array("audioSamples", 10);

export const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: fileFilter,
}).fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "photos", maxCount: 10 },
  { name: "videos", maxCount: 5 },
  { name: "audioSamples", maxCount: 10 },
]);

export const getFileUrl = (req: any, filepath: string): string => {
  return `${req.protocol}://${req.get("host")}/${filepath.replace(/\\/g, "/")}`;
};

export const deleteFile = (filepath: string): void => {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};
