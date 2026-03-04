import { MusicianRepository } from "../repositories/musician.repository";
import {
  CreateMusicianDto,
  CreateMusicianCalendarEventDto,
  MusicianCalendarEventResponseDto,
  UpdateMusicianDto,
  MusicianResponseDto,
} from "../dtos/musician.dto";
import { IMusician } from "../models/musician.model";
import { HttpError } from "../errors/http-error";
import { deleteFile } from "../middlewares/upload.middleware";
import { NotificationService } from "./notification.service";
import { UserModel } from "../models/user.model";

export class MusicianService {
  private musicianRepository: MusicianRepository;
  private notificationService: NotificationService;

  constructor() {
    this.musicianRepository = new MusicianRepository();
    this.notificationService = new NotificationService();
  }

  async createProfile(
    userId: string,
    data: CreateMusicianDto,
  ): Promise<MusicianResponseDto> {
    const existingProfile = await this.musicianRepository.findByUserId(userId);
    if (existingProfile) {
      throw new HttpError(409, "Musician profile already exists for this user");
    }

    const musician = await this.musicianRepository.create(userId, data);

    return this.toResponseDto(musician);
  }

  async getProfileByUserId(userId: string): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.findByUserId(userId);

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    return this.toResponseDto(musician);
  }

  async getProfileById(musicianId: string): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.findById(musicianId);

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    return this.toResponseDto(musician);
  }

  async updateProfile(
    userId: string,
    data: UpdateMusicianDto,
  ): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.update(userId, data);

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    return this.toResponseDto(musician);
  }

  async deleteProfile(userId: string): Promise<void> {
    const musician = await this.musicianRepository.findByUserId(userId);

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    if (musician.profilePicture) {
      deleteFile(musician.profilePicture);
    }

    musician.photos.forEach((photo) => deleteFile(photo));
    musician.videos.forEach((video) => deleteFile(video));
    musician.audioSamples.forEach((audio) => deleteFile(audio));

    await this.musicianRepository.delete(userId);
  }

  async searchMusicians(filters: {
    location?: string;
    genres?: string[];
    instruments?: string[];
    isAvailable?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    musicians: MusicianResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { musicians, total } = await this.musicianRepository.findAll(filters);

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      musicians: musicians.map((m) => this.toResponseDto(m)),
      total,
      page,
      totalPages,
    };
  }

  async updateAvailability(
    userId: string,
    isAvailable: boolean,
  ): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.updateAvailability(
      userId,
      isAvailable,
    );

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    return this.toResponseDto(musician);
  }

  async updateVerification(
    userId: string,
    isVerified: boolean,
    rejectionReason?: string,
  ): Promise<MusicianResponseDto> {
    const existing = await this.musicianRepository.findByUserId(userId);
    if (!existing) {
      throw new HttpError(404, "Musician profile not found");
    }

    if (isVerified && !existing.verificationRequested && !existing.isVerified) {
      throw new HttpError(
        400,
        "Musician must request verification before admin approval",
      );
    }

    const musician = await this.musicianRepository.updateVerification(
      userId,
      isVerified,
    );

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    const customReason = rejectionReason?.trim();

    await this.notificationService.sendNotification({
      userId,
      type: isVerified ? "verification_approved" : "verification_rejected",
      title: isVerified
        ? "Musician verification approved"
        : "Musician verification rejected",
      content: isVerified
        ? "Your musician profile has been verified by admin."
        : customReason
          ? `Your musician verification request was not approved. Reason: ${customReason}`
          : "Your musician verification request was not approved. Please review your profile and try again.",
    });

    return this.toResponseDto(musician);
  }

  async requestVerification(userId: string): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.findByUserId(userId);

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    if (musician.isVerified) {
      throw new HttpError(400, "Musician profile is already verified");
    }

    if (musician.verificationRequested) {
      throw new HttpError(409, "Verification request is already pending");
    }

    const updated = await this.musicianRepository.requestVerification(userId);
    const requester = await UserModel.findById(userId).select("username");
    const admins = await UserModel.find({ role: "admin" }).select("_id");

    await this.notificationService.sendNotification({
      userId,
      type: "system",
      title: "Verification request sent",
      content:
        "Your musician verification request has been sent to admin for review.",
    });

    await Promise.all(
      admins.map((admin) =>
        this.notificationService.sendNotification({
          userId: admin._id.toString(),
          type: "verification_request",
          title: "New musician verification request",
          content: `${requester?.username || "A musician"} requested profile verification.`,
          relatedId: userId,
        }),
      ),
    );

    return this.toResponseDto(updated!);
  }

  async uploadProfilePicture(
    userId: string,
    filepath: string,
  ): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.findByUserId(userId);

    if (!musician) {
      deleteFile(filepath);
      throw new HttpError(404, "Musician profile not found");
    }

    if (musician.profilePicture) {
      deleteFile(musician.profilePicture);
    }

    const updated = await this.musicianRepository.update(userId, {
      profilePicture: filepath,
    });

    return this.toResponseDto(updated!);
  }

  async addPhotos(
    userId: string,
    filepaths: string[],
  ): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.findByUserId(userId);

    if (!musician) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(404, "Musician profile not found");
    }

    if (musician.photos.length + filepaths.length > 10) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(400, "Cannot exceed 10 photos limit");
    }

    await this.musicianRepository.addMedia(userId, "photos", filepaths);

    const updated = await this.musicianRepository.findByUserId(userId);
    return this.toResponseDto(updated!);
  }

  async removePhoto(
    userId: string,
    photoUrl: string,
  ): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.findByUserId(userId);

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    // Handle both full paths and relative paths
    const photoToRemove = musician.photos.find(
      (photo) =>
        photo === photoUrl ||
        photo.endsWith(photoUrl) ||
        photoUrl.includes(photo),
    );

    if (!photoToRemove) {
      throw new HttpError(400, "Photo not found in profile");
    }

    deleteFile(photoToRemove);
    const updated = await this.musicianRepository.removeMedia(
      userId,
      "photos",
      photoToRemove,
    );

    return this.toResponseDto(updated!);
  }

  async addVideos(
    userId: string,
    filepaths: string[],
  ): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.findByUserId(userId);

    if (!musician) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(404, "Musician profile not found");
    }

    if (musician.videos.length + filepaths.length > 5) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(400, "Cannot exceed 5 videos limit");
    }

    await this.musicianRepository.addMedia(userId, "videos", filepaths);

    const updated = await this.musicianRepository.findByUserId(userId);
    return this.toResponseDto(updated!);
  }

  async removeVideo(
    userId: string,
    videoUrl: string,
  ): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.findByUserId(userId);

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    // Handle both full paths and relative paths
    const videoToRemove = musician.videos.find(
      (video) =>
        video === videoUrl ||
        video.endsWith(videoUrl) ||
        videoUrl.includes(video),
    );

    if (!videoToRemove) {
      throw new HttpError(400, "Video not found in profile");
    }

    deleteFile(videoToRemove);
    const updated = await this.musicianRepository.removeMedia(
      userId,
      "videos",
      videoToRemove,
    );

    return this.toResponseDto(updated!);
  }

  async addAudioSamples(
    userId: string,
    filepaths: string[],
  ): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.findByUserId(userId);

    if (!musician) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(404, "Musician profile not found");
    }

    if (musician.audioSamples.length + filepaths.length > 10) {
      filepaths.forEach((filepath) => deleteFile(filepath));
      throw new HttpError(400, "Cannot exceed 10 audio samples limit");
    }

    await this.musicianRepository.addMedia(userId, "audioSamples", filepaths);

    const updated = await this.musicianRepository.findByUserId(userId);
    return this.toResponseDto(updated!);
  }

  async removeAudioSample(
    userId: string,
    audioUrl: string,
  ): Promise<MusicianResponseDto> {
    const musician = await this.musicianRepository.findByUserId(userId);

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    // Handle both full paths and relative paths
    const audioToRemove = musician.audioSamples.find(
      (audio) =>
        audio === audioUrl ||
        audio.endsWith(audioUrl) ||
        audioUrl.includes(audio),
    );

    if (!audioToRemove) {
      throw new HttpError(400, "Audio sample not found in profile");
    }

    deleteFile(audioToRemove);
    const updated = await this.musicianRepository.removeMedia(
      userId,
      "audioSamples",
      audioToRemove,
    );

    return this.toResponseDto(updated!);
  }

  async getCalendarEvents(
    userId: string,
  ): Promise<MusicianCalendarEventResponseDto[]> {
    const musician = await this.musicianRepository.getCalendarEvents(userId);

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    return [...(musician.calendarEvents || [])]
      .sort((first, second) => {
        const firstTime = new Date(first.date).getTime();
        const secondTime = new Date(second.date).getTime();
        return firstTime - secondTime;
      })
      .map((event) => ({
        id: event._id.toString(),
        title: event.title,
        date: event.date,
        note: event.note,
        createdAt: event.createdAt,
      }));
  }

  async addCalendarEvent(
    userId: string,
    data: CreateMusicianCalendarEventDto,
  ): Promise<MusicianCalendarEventResponseDto> {
    const parsedDate = new Date(data.date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new HttpError(400, "Invalid event date");
    }

    const normalizedDate = new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
    );

    const musician = await this.musicianRepository.addCalendarEvent(userId, {
      title: data.title.trim(),
      date: normalizedDate,
      note: data.note?.trim() || undefined,
    });

    if (!musician) {
      throw new HttpError(404, "Musician profile not found");
    }

    const createdEvent =
      musician.calendarEvents[musician.calendarEvents.length - 1];
    if (!createdEvent) {
      throw new HttpError(500, "Failed to create calendar event");
    }

    return {
      id: createdEvent._id.toString(),
      title: createdEvent.title,
      date: createdEvent.date,
      note: createdEvent.note,
      createdAt: createdEvent.createdAt,
    };
  }

  async removeCalendarEvent(userId: string, eventId: string): Promise<void> {
    const existing = await this.musicianRepository.getCalendarEvents(userId);
    if (!existing) {
      throw new HttpError(404, "Musician profile not found");
    }

    const exists = (existing.calendarEvents || []).some(
      (event) => event._id.toString() === eventId,
    );

    if (!exists) {
      throw new HttpError(404, "Calendar event not found");
    }

    await this.musicianRepository.removeCalendarEvent(userId, eventId);
  }

  private toResponseDto(musician: IMusician): MusicianResponseDto {
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

    return {
      id: musician._id.toString(),
      userId: normalizeUserId(musician.userId),
      stageName: musician.stageName,
      profilePicture: musician.profilePicture || "",
      bio: musician.bio,
      phone: musician.phone,
      location: musician.location,
      genres: musician.genres,
      instruments: musician.instruments,
      experienceYears: musician.experienceYears,
      hourlyRate: musician.hourlyRate,
      photos: musician.photos,
      videos: musician.videos,
      audioSamples: musician.audioSamples,
      isAvailable: musician.isAvailable,
      isVerified: musician.isVerified,
      verificationRequested: musician.verificationRequested,
      createdAt: musician.createdAt,
      updatedAt: musician.updatedAt,
    };
  }
}
