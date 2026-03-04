import { MusicianModel, IMusician } from "../models/musician.model";
import {
  CreateMusicianDto,
  CreateMusicianCalendarEventDto,
  UpdateMusicianDto,
} from "../dtos/musician.dto";
import { sanitizeRegex } from "../utils/regex";

export class MusicianRepository {
  async create(userId: string, data: CreateMusicianDto): Promise<IMusician> {
    const musician = new MusicianModel({
      userId,
      ...data,
    });
    return await musician.save();
  }

  async findByUserId(userId: string): Promise<IMusician | null> {
    return await MusicianModel.findOne({ userId });
  }

  async findById(id: string): Promise<IMusician | null> {
    return await MusicianModel.findById(id).populate(
      "userId",
      "username email",
    );
  }

  async update(
    userId: string,
    data: UpdateMusicianDto,
  ): Promise<IMusician | null> {
    return await MusicianModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  async delete(userId: string): Promise<IMusician | null> {
    return await MusicianModel.findOneAndDelete({ userId });
  }

  async findAll(filters: {
    location?: string;
    genres?: string[];
    instruments?: string[];
    isAvailable?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ musicians: IMusician[]; total: number }> {
    const {
      location,
      genres,
      instruments,
      isAvailable,
      page = 1,
      limit = 10,
    } = filters;

    const query: any = {};

    if (location) query.location = new RegExp(sanitizeRegex(location), "i");
    if (genres && genres.length > 0) query.genres = { $in: genres };
    if (instruments && instruments.length > 0)
      query.instruments = { $in: instruments };
    if (isAvailable !== undefined) query.isAvailable = isAvailable;

    const validatedPage = Math.max(1, page);
    const skip = (validatedPage - 1) * limit;

    const [musicians, total] = await Promise.all([
      MusicianModel.find(query)
        .populate("userId", "username email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      MusicianModel.countDocuments(query),
    ]);

    return { musicians, total };
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await MusicianModel.countDocuments({ userId });
    return count > 0;
  }

  async updateAvailability(
    userId: string,
    isAvailable: boolean,
  ): Promise<IMusician | null> {
    return await MusicianModel.findOneAndUpdate(
      { userId },
      { $set: { isAvailable } },
      { new: true },
    );
  }

  async updateVerification(
    userId: string,
    isVerified: boolean,
  ): Promise<IMusician | null> {
    return await MusicianModel.findOneAndUpdate(
      { userId },
      { $set: { isVerified, verificationRequested: false } },
      { new: true },
    );
  }

  async requestVerification(userId: string): Promise<IMusician | null> {
    return await MusicianModel.findOneAndUpdate(
      { userId },
      { $set: { verificationRequested: true } },
      { new: true },
    );
  }

  async addMedia(
    userId: string,
    mediaType: "photos" | "videos" | "audioSamples",
    urls: string | string[],
  ): Promise<IMusician | null> {
    const updateQuery = Array.isArray(urls)
      ? { $addToSet: { [mediaType]: { $each: urls } } }
      : { $addToSet: { [mediaType]: urls } };

    return await MusicianModel.findOneAndUpdate({ userId }, updateQuery, {
      new: true,
    });
  }

  async removeMedia(
    userId: string,
    mediaType: "photos" | "videos" | "audioSamples",
    url: string,
  ): Promise<IMusician | null> {
    return await MusicianModel.findOneAndUpdate(
      { userId },
      { $pull: { [mediaType]: url } },
      { new: true },
    );
  }

  async getCalendarEvents(userId: string): Promise<IMusician | null> {
    return await MusicianModel.findOne({ userId }).select("calendarEvents");
  }

  async addCalendarEvent(
    userId: string,
    event: { title: string; date: Date; note?: string },
  ): Promise<IMusician | null> {
    return await MusicianModel.findOneAndUpdate(
      { userId },
      {
        $push: {
          calendarEvents: {
            title: event.title,
            date: event.date,
            ...(event.note ? { note: event.note } : {}),
          },
        },
      },
      { new: true },
    );
  }

  async removeCalendarEvent(
    userId: string,
    eventId: string,
  ): Promise<IMusician | null> {
    return await MusicianModel.findOneAndUpdate(
      { userId },
      { $pull: { calendarEvents: { _id: eventId } } },
      { new: true },
    );
  }
}
