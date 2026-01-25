import { MusicianModel, IMusician } from "../models/musicain.model";
import { CreateMusicianDto, UpdateMusicianDto } from "../dtos/musicain.dto";

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
    city?: string;
    country?: string;
    genres?: string[];
    instruments?: string[];
    isAvailable?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ musicians: IMusician[]; total: number }> {
    const {
      city,
      country,
      genres,
      instruments,
      isAvailable,
      page = 1,
      limit = 10,
    } = filters;

    const query: any = {};

    if (city) query["location.city"] = new RegExp(city, "i");
    if (country) query["location.country"] = new RegExp(country, "i");
    if (genres && genres.length > 0) query.genres = { $in: genres };
    if (instruments && instruments.length > 0)
      query.instruments = { $in: instruments };
    if (isAvailable !== undefined) query.isAvailable = isAvailable;

    const skip = (page - 1) * limit;

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

  async addMedia(
    userId: string,
    mediaType: "photos" | "videos" | "audioSamples",
    url: string,
  ): Promise<IMusician | null> {
    return await MusicianModel.findOneAndUpdate(
      { userId },
      { $push: { [mediaType]: url } },
      { new: true },
    );
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
}
