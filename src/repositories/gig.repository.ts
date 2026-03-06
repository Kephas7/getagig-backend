import { GigModel, IGig } from "../models/gig.model";
import { CreateGigDto, UpdateGigDto } from "../dtos/gig.dto";
import { sanitizeRegex } from "../utils/regex";

export class GigRepository {
  async create(organizerId: string, data: CreateGigDto): Promise<IGig> {
    const gig = new GigModel({
      organizerId,
      ...data,
    });
    return await gig.save();
  }

  async findById(id: string): Promise<IGig | null> {
    return await GigModel.findById(id).populate({
      path: "organizerId",
      populate: {
        path: "userId",
        select: "username email role profilePicture",
      },
    });
  }

  async findAll(filters: {
    title?: string;
    location?: string;
    genres?: string[];
    instruments?: string[];
    status?: string;
    organizerId?: string;
    page: number;
    limit: number;
  }): Promise<{ gigs: IGig[]; total: number }> {
    const {
      title,
      location,
      genres,
      instruments,
      status,
      organizerId,
      page,
      limit,
    } = filters;
    const query: any = {};

    if (title) query.title = new RegExp(sanitizeRegex(title), "i");
    if (location) query.location = new RegExp(sanitizeRegex(location), "i");
    if (genres && genres.length > 0) query.genres = { $in: genres };
    if (instruments && instruments.length > 0)
      query.instruments = { $in: instruments };
    if (status) query.status = status;
    if (organizerId) query.organizerId = organizerId;

    const skip = (Math.max(1, page) - 1) * limit;

    const [gigs, total] = await Promise.all([
      GigModel.find(query)
        .populate({
          path: "organizerId",
          populate: {
            path: "userId",
            select: "username email role profilePicture",
          },
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      GigModel.countDocuments(query),
    ]);

    return { gigs, total };
  }

  async update(
    id: string,
    organizerId: string,
    data: Partial<IGig>,
  ): Promise<IGig | null> {
    return await GigModel.findOneAndUpdate(
      { _id: id, organizerId },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  async delete(id: string, organizerId: string): Promise<IGig | null> {
    return await GigModel.findOneAndDelete({ _id: id, organizerId });
  }
}
