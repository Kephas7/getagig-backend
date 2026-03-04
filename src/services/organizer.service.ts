import { OrganizerRepository } from "../repositories/organizer.repository";
import {
  CreateOrganizerDto,
  UpdateOrganizerDto,
  OrganizerResponseDto,
} from "../dtos/organizer.dto";
import { IOrganizer } from "../models/organizer.model";
import { HttpError } from "../errors/http-error";
import { deleteFile } from "../middlewares/upload.middleware";
import { NotificationService } from "./notification.service";
import { UserModel } from "../models/user.model";

export class OrganizerService {
  private organizerRepository: OrganizerRepository;
  private notificationService: NotificationService;

  constructor() {
    this.organizerRepository = new OrganizerRepository();
    this.notificationService = new NotificationService();
  }

  async createProfile(
    userId: string,
    data: CreateOrganizerDto,
  ): Promise<OrganizerResponseDto> {
    const existingProfile = await this.organizerRepository.findByUserId(userId);
    if (existingProfile) {
      throw new HttpError(
        409,
        "Organizer profile already exists for this user",
      );
    }

    const organizer = await this.organizerRepository.create(userId, data);

    return this.toResponseDto(organizer);
  }

  async getProfileByUserId(userId: string): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.findByUserId(userId);

    if (!organizer) {
      throw new HttpError(404, "Organizer profile not found");
    }

    return this.toResponseDto(organizer);
  }

  async getProfileById(organizerId: string): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.findById(organizerId);

    if (!organizer) {
      throw new HttpError(404, "Organizer profile not found");
    }

    return this.toResponseDto(organizer);
  }

  async updateProfile(
    userId: string,
    data: UpdateOrganizerDto,
  ): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.update(userId, data);

    if (!organizer) {
      throw new HttpError(404, "Organizer profile not found");
    }

    return this.toResponseDto(organizer);
  }

  async deleteProfile(userId: string): Promise<void> {
    const organizer = await this.organizerRepository.findByUserId(userId);

    if (!organizer) {
      throw new HttpError(404, "Organizer profile not found");
    }

    if (organizer.profilePicture) {
      deleteFile(organizer.profilePicture);
    }

    organizer.photos.forEach((photo) => deleteFile(photo));
    organizer.videos.forEach((video) => deleteFile(video));
    organizer.verificationDocuments.forEach((doc) => deleteFile(doc));

    await this.organizerRepository.delete(userId);
  }

  async searchOrganizers(filters: {
    location?: string;
    organizationType?: string;
    eventTypes?: string[];
    isVerified?: boolean;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    organizers: OrganizerResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { organizers, total } =
      await this.organizerRepository.findAll(filters);

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      organizers: organizers.map((o) => this.toResponseDto(o)),
      total,
      page,
      totalPages,
    };
  }

  async updateActiveStatus(
    userId: string,
    isActive: boolean,
  ): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.updateActiveStatus(
      userId,
      isActive,
    );

    if (!organizer) {
      throw new HttpError(404, "Organizer profile not found");
    }

    return this.toResponseDto(organizer);
  }

  async updateVerification(
    userId: string,
    isVerified: boolean,
    rejectionReason?: string,
  ): Promise<OrganizerResponseDto> {
    const existing = await this.organizerRepository.findByUserId(userId);
    if (!existing) {
      throw new HttpError(404, "Organizer profile not found");
    }

    if (isVerified && !existing.verificationRequested && !existing.isVerified) {
      throw new HttpError(
        400,
        "Organizer must request verification before admin approval",
      );
    }

    const organizer = await this.organizerRepository.updateVerification(
      userId,
      isVerified,
    );

    if (!organizer) {
      throw new HttpError(404, "Organizer profile not found");
    }

    const customReason = rejectionReason?.trim();

    await this.notificationService.sendNotification({
      userId,
      type: isVerified ? "verification_approved" : "verification_rejected",
      title: isVerified
        ? "Organizer verification approved"
        : "Organizer verification rejected",
      content: isVerified
        ? "Your organizer profile has been verified by admin."
        : customReason
          ? `Your organizer verification request was not approved. Reason: ${customReason}`
          : "Your organizer verification request was not approved. Please review your profile and try again.",
    });

    return this.toResponseDto(organizer);
  }

  async requestVerification(userId: string): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.findByUserId(userId);

    if (!organizer) {
      throw new HttpError(404, "Organizer profile not found");
    }

    if (organizer.isVerified) {
      throw new HttpError(400, "Organizer profile is already verified");
    }

    if (organizer.verificationRequested) {
      throw new HttpError(409, "Verification request is already pending");
    }

    const updated = await this.organizerRepository.requestVerification(userId);
    const requester = await UserModel.findById(userId).select("username");
    const admins = await UserModel.find({ role: "admin" }).select("_id");

    await this.notificationService.sendNotification({
      userId,
      type: "system",
      title: "Verification request sent",
      content:
        "Your organizer verification request has been sent to admin for review.",
    });

    await Promise.all(
      admins.map((admin) =>
        this.notificationService.sendNotification({
          userId: admin._id.toString(),
          type: "verification_request",
          title: "New organizer verification request",
          content: `${requester?.username || "An organizer"} requested profile verification.`,
          relatedId: userId,
        }),
      ),
    );

    return this.toResponseDto(updated!);
  }

  async uploadProfilePicture(
    userId: string,
    filepath: string,
  ): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.findByUserId(userId);

    if (!organizer) {
      deleteFile(filepath);
      throw new HttpError(404, "Organizer profile not found");
    }

    if (organizer.profilePicture) {
      deleteFile(organizer.profilePicture);
    }

    const updated = await this.organizerRepository.update(userId, {
      profilePicture: filepath,
    });

    return this.toResponseDto(updated!);
  }

  async addPhotos(
    userId: string,
    filepaths: string[],
  ): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.findByUserId(userId);

    if (!organizer) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(404, "Organizer profile not found");
    }

    if (organizer.photos.length + filepaths.length > 20) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(400, "Cannot exceed 20 photos limit");
    }

    await this.organizerRepository.addMedia(userId, "photos", filepaths);

    const updated = await this.organizerRepository.findByUserId(userId);
    return this.toResponseDto(updated!);
  }

  async removePhoto(
    userId: string,
    photoUrl: string,
  ): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.findByUserId(userId);

    if (!organizer) {
      throw new HttpError(404, "Organizer profile not found");
    }

    // Handle both full paths and relative paths
    const photoToRemove = organizer.photos.find(
      (photo) =>
        photo === photoUrl ||
        photo.endsWith(photoUrl) ||
        photoUrl.includes(photo),
    );

    if (!photoToRemove) {
      throw new HttpError(400, "Photo not found in profile");
    }

    deleteFile(photoToRemove);
    const updated = await this.organizerRepository.removeMedia(
      userId,
      "photos",
      photoToRemove,
    );

    return this.toResponseDto(updated!);
  }

  async addVideos(
    userId: string,
    filepaths: string[],
  ): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.findByUserId(userId);

    if (!organizer) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(404, "Organizer profile not found");
    }

    if (organizer.videos.length + filepaths.length > 10) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(400, "Cannot exceed 10 videos limit");
    }

    await this.organizerRepository.addMedia(userId, "videos", filepaths);

    const updated = await this.organizerRepository.findByUserId(userId);
    return this.toResponseDto(updated!);
  }

  async removeVideo(
    userId: string,
    videoUrl: string,
  ): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.findByUserId(userId);

    if (!organizer) {
      throw new HttpError(404, "Organizer profile not found");
    }

    // Handle both full paths and relative paths
    const videoToRemove = organizer.videos.find(
      (video) =>
        video === videoUrl ||
        video.endsWith(videoUrl) ||
        videoUrl.includes(video),
    );

    if (!videoToRemove) {
      throw new HttpError(400, "Video not found in profile");
    }

    deleteFile(videoToRemove);
    const updated = await this.organizerRepository.removeMedia(
      userId,
      "videos",
      videoToRemove,
    );

    return this.toResponseDto(updated!);
  }

  async addVerificationDocuments(
    userId: string,
    filepaths: string[],
  ): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.findByUserId(userId);

    if (!organizer) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(404, "Organizer profile not found");
    }

    if (organizer.verificationDocuments.length + filepaths.length > 5) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(400, "Cannot exceed 5 verification documents limit");
    }

    await this.organizerRepository.addMedia(
      userId,
      "verificationDocuments",
      filepaths,
    );

    const updated = await this.organizerRepository.findByUserId(userId);
    return this.toResponseDto(updated!);
  }

  async removeVerificationDocument(
    userId: string,
    documentUrl: string,
  ): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.findByUserId(userId);

    if (!organizer) {
      throw new HttpError(404, "Organizer profile not found");
    }

    if (!organizer.verificationDocuments.includes(documentUrl)) {
      throw new HttpError(400, "Document not found in profile");
    }

    deleteFile(documentUrl);
    const updated = await this.organizerRepository.removeMedia(
      userId,
      "verificationDocuments",
      documentUrl,
    );

    return this.toResponseDto(updated!);
  }

  private toResponseDto(organizer: IOrganizer): OrganizerResponseDto {
    const normalizeUserId = (userRef: unknown): string => {
      if (!userRef) return "";

      if (typeof userRef === "string") {
        return userRef;
      }

      if (typeof userRef === "object") {
        const candidate = userRef as { _id?: unknown; id?: unknown };
        if (candidate._id) {
          return candidate._id.toString();
        }
        if (candidate.id) {
          return candidate.id.toString();
        }
      }

      return userRef.toString();
    };

    const getMediaUrl = (
      filename: string | undefined,
      type: string,
    ): string => {
      if (!filename) return "";

      // If it's already a URL (absolute path), return as is
      if (filename.startsWith("http://") || filename.startsWith("https://")) {
        return filename;
      }

      // If it's already a relative path, return as is
      if (filename.startsWith("/uploads/")) {
        return filename;
      }

      // Otherwise construct the relative URL
      return `/uploads/organizers/${type}/${filename}`;
    };

    return {
      id: organizer._id.toString(),
      userId: normalizeUserId(organizer.userId),
      organizationName: organizer.organizationName,
      profilePicture: getMediaUrl(organizer.profilePicture, "profile"),
      bio: organizer.bio,
      contactPerson: organizer.contactPerson,
      phone: organizer.phone,
      email: organizer.email,
      location: organizer.location,
      website: organizer.website,
      photos: organizer.photos.map((photo) => getMediaUrl(photo, "photos")),
      videos: organizer.videos.map((video) => getMediaUrl(video, "videos")),
      organizationType: organizer.organizationType,
      eventTypes: organizer.eventTypes,
      verificationDocuments: organizer.verificationDocuments.map((doc) =>
        getMediaUrl(doc, "documents"),
      ),
      isVerified: organizer.isVerified,
      verificationRequested: organizer.verificationRequested,
      isActive: organizer.isActive,
      createdAt: organizer.createdAt,
      updatedAt: organizer.updatedAt,
    };
  }
}
