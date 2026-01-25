import { Request, Response, NextFunction } from "express";
import { OrganizerService } from "../services/organizer.service";
import {
  createOrganizerSchema,
  updateOrganizerSchema,
} from "../types/organizer.type";
import { HttpError } from "../errors/http-error";
import { getFileUrl } from "../middlewares/upload.middleware";
import { IUser } from "../models/user.model";

export class OrganizerController {
  private organizerService: OrganizerService;

  constructor() {
    this.organizerService = new OrganizerService();
  }

  createProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createOrganizerSchema.parse(req.body);

      const user = req.user as IUser;
      const userId = user._id.toString();

      const organizer = await this.organizerService.createProfile(
        userId,
        validatedData,
      );

      res.status(201).json({
        success: true,
        message: "Organizer profile created successfully",
        data: organizer,
      });
    } catch (error) {
      next(error);
    }
  };

  getOwnProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      const organizer = await this.organizerService.getProfileByUserId(userId);

      res.status(200).json({
        success: true,
        data: organizer,
      });
    } catch (error) {
      next(error);
    }
  };

  getProfileById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const organizer = await this.organizerService.getProfileById(id);

      res.status(200).json({
        success: true,
        data: organizer,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateOrganizerSchema.parse(req.body);

      const user = req.user as IUser;
      const userId = user._id.toString();

      const organizer = await this.organizerService.updateProfile(
        userId,
        validatedData,
      );

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: organizer,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      await this.organizerService.deleteProfile(userId);

      res.status(200).json({
        success: true,
        message: "Profile deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  searchOrganizers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const {
        city,
        country,
        organizationType,
        eventTypes,
        isVerified,
        isActive,
        page = "1",
        limit = "10",
      } = req.query;

      const filters = {
        city: city as string,
        country: country as string,
        organizationType: organizationType as string,
        eventTypes: eventTypes ? (eventTypes as string).split(",") : undefined,
        isVerified:
          isVerified === "true"
            ? true
            : isVerified === "false"
              ? false
              : undefined,
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await this.organizerService.searchOrganizers(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateActiveStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        throw new HttpError(400, "isActive must be a boolean");
      }

      const organizer = await this.organizerService.updateActiveStatus(
        userId,
        isActive,
      );

      res.status(200).json({
        success: true,
        message: "Active status updated successfully",
        data: organizer,
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
      const { userId, isVerified } = req.body;

      if (!userId) {
        throw new HttpError(400, "User ID is required");
      }

      if (typeof isVerified !== "boolean") {
        throw new HttpError(400, "isVerified must be a boolean");
      }

      const organizer = await this.organizerService.updateVerification(
        userId,
        isVerified,
      );

      res.status(200).json({
        success: true,
        message: "Verification status updated successfully",
        data: organizer,
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

      const filepath = req.file.path;
      const fileUrl = getFileUrl(req, filepath);

      const organizer = await this.organizerService.uploadProfilePicture(
        userId,
        fileUrl,
      );

      res.status(200).json({
        success: true,
        message: "Profile picture uploaded successfully",
        data: organizer,
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

      const filepaths = req.files.map((file) => getFileUrl(req, file.path));

      const organizer = await this.organizerService.addPhotos(
        userId,
        filepaths,
      );

      res.status(200).json({
        success: true,
        message: "Photos added successfully",
        data: organizer,
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

      const organizer = await this.organizerService.removePhoto(
        userId,
        photoUrl,
      );

      res.status(200).json({
        success: true,
        message: "Photo removed successfully",
        data: organizer,
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

      const filepaths = req.files.map((file) => getFileUrl(req, file.path));

      const organizer = await this.organizerService.addVideos(
        userId,
        filepaths,
      );

      res.status(200).json({
        success: true,
        message: "Videos added successfully",
        data: organizer,
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

      const organizer = await this.organizerService.removeVideo(
        userId,
        videoUrl,
      );

      res.status(200).json({
        success: true,
        message: "Video removed successfully",
        data: organizer,
      });
    } catch (error) {
      next(error);
    }
  };

  addVerificationDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new HttpError(400, "No files uploaded");
      }

      const filepaths = req.files.map((file) => getFileUrl(req, file.path));

      const organizer = await this.organizerService.addVerificationDocuments(
        userId,
        filepaths,
      );

      res.status(200).json({
        success: true,
        message: "Verification documents added successfully",
        data: organizer,
      });
    } catch (error) {
      next(error);
    }
  };

  removeVerificationDocument = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = req.user as IUser;
      const userId = user._id.toString();

      const { documentUrl } = req.body;

      if (!documentUrl) {
        throw new HttpError(400, "Document URL is required");
      }

      const organizer = await this.organizerService.removeVerificationDocument(
        userId,
        documentUrl,
      );

      res.status(200).json({
        success: true,
        message: "Verification document removed successfully",
        data: organizer,
      });
    } catch (error) {
      next(error);
    }
  };
}
