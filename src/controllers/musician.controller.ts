//musician controller
import { Request, Response, NextFunction } from "express";
import { MusicianService } from "../services/musician.service";
import {
  createMusicianCalendarEventSchema,
  createMusicianSchema,
  updateMusicianSchema,
} from "../types/musician.type";
import { HttpError } from "../errors/http-error";
import { IUser } from "../models/user.model";
import { getFileUrl } from "../middlewares/upload.middleware";

export class MusicianController {
  private musicianService: MusicianService;

  constructor() {
    this.musicianService = new MusicianService();
  }

  createProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createMusicianSchema.parse(req.body);

      const user = req.user as IUser;
      const userId = user._id.toString();

      const musician = await this.musicianService.createProfile(
        userId,
        validatedData,
      );

      res.status(201).json({
        success: true,
        message: "Musician profile created successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  getOwnProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      const musician = await this.musicianService.getProfileByUserId(userId);

      res.status(200).json({
        success: true,
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  getProfileById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const musician = await this.musicianService.getProfileById(id);

      res.status(200).json({
        success: true,
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateMusicianSchema.parse(req.body);

      const user = req.user as IUser;
      const userId = user._id.toString();

      const musician = await this.musicianService.updateProfile(
        userId,
        validatedData,
      );

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      await this.musicianService.deleteProfile(userId);

      res.status(200).json({
        success: true,
        message: "Profile deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  searchMusicians = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        location,
        genres,
        instruments,
        isAvailable,
        page = "1",
        limit = "10",
      } = req.query;

      const filters = {
        location: location as string,
        genres: genres ? (genres as string).split(",") : undefined,
        instruments: instruments
          ? (instruments as string).split(",")
          : undefined,
        isAvailable:
          isAvailable === "true"
            ? true
            : isAvailable === "false"
              ? false
              : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await this.musicianService.searchMusicians(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      const { isAvailable } = req.body;

      if (typeof isAvailable !== "boolean") {
        throw new HttpError(400, "isAvailable must be a boolean");
      }

      const musician = await this.musicianService.updateAvailability(
        userId,
        isAvailable,
      );

      res.status(200).json({
        success: true,
        message: "Availability updated successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  getCalendarEvents = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      const events = await this.musicianService.getCalendarEvents(userId);

      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  };

  addCalendarEvent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const validatedData = createMusicianCalendarEventSchema.parse(req.body);
      const user = req.user as IUser;
      const userId = user._id.toString();

      const event = await this.musicianService.addCalendarEvent(
        userId,
        validatedData,
      );

      res.status(201).json({
        success: true,
        message: "Calendar event created successfully",
        data: event,
      });
    } catch (error) {
      next(error);
    }
  };

  removeCalendarEvent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();
      const { eventId } = req.params;

      if (!eventId) {
        throw new HttpError(400, "Event ID is required");
      }

      await this.musicianService.removeCalendarEvent(userId, eventId);

      res.status(200).json({
        success: true,
        message: "Calendar event deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  updateVerification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { userId, isVerified, rejectionReason } = req.body;

      if (!userId) {
        throw new HttpError(400, "User ID is required");
      }

      if (typeof isVerified !== "boolean") {
        throw new HttpError(400, "isVerified must be a boolean");
      }

      const musician = await this.musicianService.updateVerification(
        userId,
        isVerified,
        rejectionReason,
      );

      res.status(200).json({
        success: true,
        message: "Verification status updated successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  requestVerification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      const musician = await this.musicianService.requestVerification(userId);

      res.status(200).json({
        success: true,
        message: "Verification request submitted successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  uploadProfilePicture = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      if (!req.file) {
        throw new HttpError(400, "No file uploaded");
      }

      // Store relative path like /uploads/musicians/profile/uuid.ext
      const filepath = getFileUrl(req, req.file.path);

      const musician = await this.musicianService.uploadProfilePicture(
        userId,
        filepath,
      );

      res.status(200).json({
        success: true,
        message: "Profile picture uploaded successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  addPhotos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new HttpError(400, "No files uploaded");
      }

      // Store relative paths like /uploads/musicians/photos/uuid.ext
      const filepaths = req.files.map((file) => getFileUrl(req, file.path));

      const musician = await this.musicianService.addPhotos(userId, filepaths);

      res.status(200).json({
        success: true,
        message: "Photos added successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  removePhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      const { photoUrl } = req.body;

      if (!photoUrl) {
        throw new HttpError(400, "Photo URL is required");
      }

      const musician = await this.musicianService.removePhoto(userId, photoUrl);

      res.status(200).json({
        success: true,
        message: "Photo removed successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  addVideos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new HttpError(400, "No files uploaded");
      }

      // Store relative paths like /uploads/musicians/videos/uuid.ext
      const filepaths = req.files.map((file) => getFileUrl(req, file.path));

      const musician = await this.musicianService.addVideos(userId, filepaths);

      res.status(200).json({
        success: true,
        message: "Videos added successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  removeVideo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      const { videoUrl } = req.body;

      if (!videoUrl) {
        throw new HttpError(400, "Video URL is required");
      }

      const musician = await this.musicianService.removeVideo(userId, videoUrl);

      res.status(200).json({
        success: true,
        message: "Video removed successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  addAudioSamples = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new HttpError(400, "No files uploaded");
      }

      // Store relative paths like /uploads/musicians/audio/uuid.ext
      const filepaths = req.files.map((file) => getFileUrl(req, file.path));

      const musician = await this.musicianService.addAudioSamples(
        userId,
        filepaths,
      );

      res.status(200).json({
        success: true,
        message: "Audio samples added successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };

  removeAudioSample = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      const { audioUrl } = req.body;

      if (!audioUrl) {
        throw new HttpError(400, "Audio URL is required");
      }

      const musician = await this.musicianService.removeAudioSample(
        userId,
        audioUrl,
      );

      res.status(200).json({
        success: true,
        message: "Audio sample removed successfully",
        data: musician,
      });
    } catch (error) {
      next(error);
    }
  };
}
