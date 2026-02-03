import { MusicianRepository } from "../repositories/musician.repository";
import {
  CreateMusicianDto,
  UpdateMusicianDto,
  MusicianResponseDto,
} from "../dtos/musician.dto";
import { IMusician } from "../models/musician.model";
import { HttpError } from "../errors/http-error";
import { deleteFile } from "../middlewares/upload.middleware";

export class MusicianService {
  private musicianRepository: MusicianRepository;

  constructor() {
    this.musicianRepository = new MusicianRepository();
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
    city?: string;
    country?: string;
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

    for (const filepath of filepaths) {
      await this.musicianRepository.addMedia(userId, "photos", filepath);
    }

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

    for (const filepath of filepaths) {
      await this.musicianRepository.addMedia(userId, "videos", filepath);
    }

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

    for (const filepath of filepaths) {
      await this.musicianRepository.addMedia(userId, "audioSamples", filepath);
    }

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

  private toResponseDto(musician: IMusician): MusicianResponseDto {
  return {
    id: musician._id.toString(),
    userId: musician.userId.toString(),
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
    createdAt: musician.createdAt,
    updatedAt: musician.updatedAt,
  };
}
}
