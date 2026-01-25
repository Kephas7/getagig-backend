import { OrganizerModel, IOrganizer } from "../models/organizer.model";
import { CreateOrganizerDto, UpdateOrganizerDto } from "../dtos/organizer.dto";

export class OrganizerRepository {
  async create(userId: string, data: CreateOrganizerDto): Promise<IOrganizer> {
    const organizer = new OrganizerModel({
      userId,
      ...data,
    });
    return await organizer.save();
  }

  async findByUserId(userId: string): Promise<IOrganizer | null> {
    return await OrganizerModel.findOne({ userId });
  }

  async findById(id: string): Promise<IOrganizer | null> {
    return await OrganizerModel.findById(id).populate(
      "userId",
      "username email",
    );
  }

  async update(
    userId: string,
    data: UpdateOrganizerDto,
  ): Promise<IOrganizer | null> {
    return await OrganizerModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  async delete(userId: string): Promise<IOrganizer | null> {
    return await OrganizerModel.findOneAndDelete({ userId });
  }

  async findAll(filters: {
    city?: string;
    country?: string;
    organizationType?: string;
    eventTypes?: string[];
    isVerified?: boolean;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ organizers: IOrganizer[]; total: number }> {
    const {
      city,
      country,
      organizationType,
      eventTypes,
      isVerified,
      isActive,
      page = 1,
      limit = 10,
    } = filters;

    const query: any = {};

    if (city) query["location.city"] = new RegExp(city, "i");
    if (country) query["location.country"] = new RegExp(country, "i");
    if (organizationType)
      query.organizationType = new RegExp(organizationType, "i");
    if (eventTypes && eventTypes.length > 0)
      query.eventTypes = { $in: eventTypes };
    if (isVerified !== undefined) query.isVerified = isVerified;
    if (isActive !== undefined) query.isActive = isActive;

    const skip = (page - 1) * limit;

    const [organizers, total] = await Promise.all([
      OrganizerModel.find(query)
        .populate("userId", "username email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      OrganizerModel.countDocuments(query),
    ]);

    return { organizers, total };
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await OrganizerModel.countDocuments({ userId });
    return count > 0;
  }

  async updateVerification(
    userId: string,
    isVerified: boolean,
  ): Promise<IOrganizer | null> {
    return await OrganizerModel.findOneAndUpdate(
      { userId },
      { $set: { isVerified } },
      { new: true },
    );
  }

  async updateActiveStatus(
    userId: string,
    isActive: boolean,
  ): Promise<IOrganizer | null> {
    return await OrganizerModel.findOneAndUpdate(
      { userId },
      { $set: { isActive } },
      { new: true },
    );
  }

  async addMedia(
    userId: string,
    mediaType: "photos" | "videos" | "verificationDocuments",
    url: string,
  ): Promise<IOrganizer | null> {
    return await OrganizerModel.findOneAndUpdate(
      { userId },
      { $push: { [mediaType]: url } },
      { new: true },
    );
  }

  async removeMedia(
    userId: string,
    mediaType: "photos" | "videos" | "verificationDocuments",
    url: string,
  ): Promise<IOrganizer | null> {
    return await OrganizerModel.findOneAndUpdate(
      { userId },
      { $pull: { [mediaType]: url } },
      { new: true },
    );
  }
}
