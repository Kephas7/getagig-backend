import { OrganizerRepository } from "../repositories/organizer.repository";
import {
  CreateOrganizerDto,
  UpdateOrganizerDto,
  OrganizerResponseDto,
} from "../dtos/organizer.dto";
import { IOrganizer } from "../models/organizer.model";
import { HttpError } from "../errors/http-error";
import { deleteFile } from "../middlewares/upload.middleware";

export class OrganizerService {
  private organizerRepository: OrganizerRepository;

  constructor() {
    this.organizerRepository = new OrganizerRepository();
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
    city?: string;
    country?: string;
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
  ): Promise<OrganizerResponseDto> {
    const organizer = await this.organizerRepository.updateVerification(
      userId,
      isVerified,
    );

    if (!organizer) {
      throw new HttpError(404, "Organizer profile not found");
    }

    return this.toResponseDto(organizer);
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

    for (const filepath of filepaths) {
      await this.organizerRepository.addMedia(userId, "photos", filepath);
    }

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

    for (const filepath of filepaths) {
      await this.organizerRepository.addMedia(userId, "videos", filepath);
    }

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

    for (const filepath of filepaths) {
      await this.organizerRepository.addMedia(
        userId,
        "verificationDocuments",
        filepath,
      );
    }

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
      userId: organizer.userId.toString(),
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
      isActive: organizer.isActive,
      createdAt: organizer.createdAt,
      updatedAt: organizer.updatedAt,
    };
  }
}
