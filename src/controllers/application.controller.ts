import { Request, Response, NextFunction } from "express";
import { ApplicationService } from "../services/application.service";
import { MusicianModel } from "../models/musician.model";
import { OrganizerModel } from "../models/organizer.model";
import { HttpError } from "../errors/http-error";

export class ApplicationController {
    private applicationService: ApplicationService;

    constructor() {
        this.applicationService = new ApplicationService();
    }

    apply = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = (req as any).user;
            const musician = await MusicianModel.findOne({ userId: user._id });
            if (!musician) {
                throw new HttpError(404, "Musician profile not found");
            }

            const result = await this.applicationService.applyToGig((musician._id as any).toString(), req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    getGigApplications = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const organizer = await OrganizerModel.findOne({ userId: (req as any).user._id });
            if (!organizer) throw new HttpError(404, "Organizer profile not found");

            const result = await this.applicationService.getApplicationsByGig(req.params.gigId, (organizer._id as any).toString());
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    getMyApplications = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const musician = await MusicianModel.findOne({ userId: (req as any).user._id });
            if (!musician) throw new HttpError(404, "Musician profile not found");

            const result = await this.applicationService.getMusicianApplications((musician._id as any).toString());
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const organizer = await OrganizerModel.findOne({ userId: (req as any).user._id });
            if (!organizer) throw new HttpError(404, "Organizer profile not found");

            const result = await this.applicationService.updateApplicationStatus(
                req.params.id,
                (organizer._id as any).toString(),
                req.body.status
            );
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };
}
