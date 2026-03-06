import { GigRepository } from "../repositories/gig.repository";
import { CreateGigDto, UpdateGigDto, GigResponseDto } from "../dtos/gig.dto";
import { IGig } from "../models/gig.model";
import { HttpError } from "../errors/http-error";
import { OrganizerRepository } from "../repositories/organizer.repository";

export class GigService {
  private gigRepository: GigRepository;
  private organizerRepository: OrganizerRepository;

  constructor() {
    this.gigRepository = new GigRepository();
    this.organizerRepository = new OrganizerRepository();
  }

  async createGig(userId: string, data: CreateGigDto): Promise<GigResponseDto> {
    const organizer = await this.organizerRepository.findByUserId(userId);
    if (!organizer) {
      throw new HttpError(403, "Only verified organizers can post gigs");
    }

    const gig = await this.gigRepository.create(organizer._id.toString(), data);
    return this.toResponseDto(gig);
  }

  async getGigById(id: string): Promise<GigResponseDto> {
    const gig = await this.gigRepository.findById(id);
    if (!gig) {
      throw new HttpError(404, "Gig not found");
    }
    return this.toResponseDto(gig);
  }

  async getAllGigs(filters: any): Promise<{
    gigs: GigResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { gigs, total } = await this.gigRepository.findAll(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    return {
      gigs: gigs.map((gig) => this.toResponseDto(gig)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateGig(
    userId: string,
    gigId: string,
    data: UpdateGigDto,
  ): Promise<GigResponseDto> {
    const organizer = await this.organizerRepository.findByUserId(userId);
    if (!organizer) {
      throw new HttpError(403, "Unauthorized");
    }

    const gig = await this.gigRepository.update(
      gigId,
      organizer._id.toString(),
      data,
    );
    if (!gig) {
      throw new HttpError(404, "Gig not found or unauthorized");
    }

    return this.toResponseDto(gig);
  }

  async deleteGig(userId: string, gigId: string): Promise<void> {
    const organizer = await this.organizerRepository.findByUserId(userId);
    if (!organizer) {
      throw new HttpError(403, "Unauthorized");
    }

    const gig = await this.gigRepository.delete(
      gigId,
      organizer._id.toString(),
    );
    if (!gig) {
      throw new HttpError(404, "Gig not found or unauthorized");
    }
  }

  private toResponseDto(gig: IGig): GigResponseDto {
    const organizerContainer = (gig as any).organizerId;
    const user = organizerContainer?.userId;

    return {
      id: gig._id.toString(),
      title: gig.title,
      description: gig.description,
      organizerId: (organizerContainer?._id || gig.organizerId).toString(),
      organizer: user
        ? {
            _id: organizerContainer._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role || "organizer",
            organizationName: organizerContainer.organizationName,
            profilePicture:
              organizerContainer.profilePicture || user.profilePicture,
            displayName:
              organizerContainer.organizationName ||
              user.username ||
              user.email,
          }
        : undefined,
      location: gig.location,
      genres: gig.genres,
      instruments: gig.instruments,
      payRate: gig.payRate,
      eventType: gig.eventType,
      status: gig.status,
      eventDate: gig.eventDate,
      deadline: gig.deadline,
      createdAt: gig.createdAt,
      updatedAt: gig.updatedAt,
    };
  }
}
