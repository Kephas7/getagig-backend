import { ApplicationRepository } from "../repositories/application.repository";
import { GigRepository } from "../repositories/gig.repository";
import {
  ApplicationResponseDto,
  CreateApplicationDto,
} from "../dtos/application.dto";
import { IApplication } from "../models/application.model";
import { HttpError } from "../errors/http-error";
import { NotificationService } from "./notification.service";
import { MusicianModel } from "../models/musician.model";

export class ApplicationService {
  private applicationRepository: ApplicationRepository;
  private gigRepository: GigRepository;
  private notificationService: NotificationService;

  constructor() {
    this.applicationRepository = new ApplicationRepository();
    this.gigRepository = new GigRepository();
    this.notificationService = new NotificationService();
  }

  async applyToGig(
    musicianId: string,
    data: CreateApplicationDto,
  ): Promise<ApplicationResponseDto> {
    // Check if gig exists
    const gig = await this.gigRepository.findById(data.gigId);
    if (!gig) {
      throw new HttpError(404, "Gig not found");
    }

    // Check if already applied
    const existing = await this.applicationRepository.findOne({
      gigId: data.gigId,
      musicianId,
    });
    if (existing) {
      throw new HttpError(400, "You have already applied for this gig");
    }

    const application = await this.applicationRepository.create(
      musicianId,
      data,
    );

    // Send notification to organizer
    try {
      const musician = await MusicianModel.findById(musicianId);
      const organizerUserId =
        (gig.organizerId as any)?.userId?._id ||
        (gig.organizerId as any)?.userId;

      if (organizerUserId) {
        await this.notificationService.sendNotification({
          userId: organizerUserId.toString(),
          type: "new_application",
          title: "New Gig Application",
          content: `${musician?.stageName || "A musician"} applied for your gig: "${gig.title}"`,
          relatedId: application._id.toString(),
        });
      }
    } catch (error) {
      console.error("Failed to send application notification:", error);
    }

    return this.toResponseDto(application);
  }

  async getApplicationsByGig(
    gigId: string,
    organizerId: string,
  ): Promise<ApplicationResponseDto[]> {
    const gig = await this.gigRepository.findById(gigId);
    if (!gig) {
      throw new HttpError(404, "Gig not found");
    }

    // Check if the requesting organizer owns the gig
    const gigOrganizerId =
      (gig.organizerId as any)._id?.toString() || gig.organizerId.toString();
    if (gigOrganizerId !== organizerId) {
      throw new HttpError(403, "Unauthorized access to gig applications");
    }

    const applications = await this.applicationRepository.findByGigId(gigId);
    return applications.map((app) => this.toResponseDto(app));
  }

  async getMusicianApplications(
    musicianId: string,
  ): Promise<ApplicationResponseDto[]> {
    const applications =
      await this.applicationRepository.findByMusicianId(musicianId);
    return applications.map((app) => this.toResponseDto(app));
  }

  async updateApplicationStatus(
    id: string,
    organizerId: string,
    status: "accepted" | "rejected",
  ): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepository.findById(id);
    if (!application) {
      throw new HttpError(404, "Application not found");
    }

    // ApplicationRepository.findById populates gigId, so we can access it directly.
    // We cast to any because TypeScript expects ObjectId, but runtime provides the populated document.
    const gig = application.gigId as any;

    if (!gig) {
      throw new HttpError(404, "Gig not found");
    }

    const gigOrganizerId =
      (gig.organizerId as any)._id?.toString() || gig.organizerId.toString();

    if (gigOrganizerId !== organizerId) {
      throw new HttpError(403, "Unauthorized");
    }

    const updated = await this.applicationRepository.updateStatus(id, status);

    // Send notification to musician
    try {
      const musicianUserId =
        (application.musicianId as any)?.userId?._id ||
        (application.musicianId as any)?.userId;
      if (musicianUserId) {
        const statusText = status === "accepted" ? "Accepted" : "Rejected";
        await this.notificationService.sendNotification({
          userId: musicianUserId.toString(),
          type:
            status === "accepted"
              ? "application_accepted"
              : "application_rejected",
          title: `Application ${statusText}`,
          content: `Your application for "${gig.title}" has been ${status}.`,
          relatedId: application._id.toString(),
        });
      }
    } catch (error) {
      console.error("Failed to send status update notification:", error);
    }

    return this.toResponseDto(updated!);
  }

  private toResponseDto(app: IApplication): ApplicationResponseDto {
    const musician = (app as any).musicianId;
    const gig = (app as any).gigId;

    const app_id = (app._id as any)?.toString() || "";
    const gig_id = (gig?._id || gig)?.toString() || "";
    const musician_id = (musician?._id || musician)?.toString() || "";

    return {
      id: app_id,
      gigId: gig_id,
      musicianId: musician_id,
      coverLetter: app.coverLetter,
      status: app.status,
      createdAt: app.createdAt.toISOString(),
      musician:
        musician && (musician.stageName || musician.userId)
          ? {
              id: (musician._id || musician).toString(),
              userId: (musician.userId?._id || musician.userId)?.toString(),
              username:
                musician.userId?.username ||
                musician.stageName ||
                "Unknown Musician",
              email: musician.userId?.email || "",
              role: "musician",
              stageName: musician.stageName,
              profilePicture: musician.profilePicture,
              instruments: musician.instruments || [],
            }
          : undefined,
      gig:
        gig && gig.title
          ? {
              id: (gig._id || gig).toString(),
              title: gig.title,
              location: gig.location,
              genres: gig.genres || [],
              instruments: gig.instruments || [],
              payRate: gig.payRate,
              eventType: gig.eventType || "",
              status: gig.status || "open",
            }
          : undefined,
    };
  }
}
