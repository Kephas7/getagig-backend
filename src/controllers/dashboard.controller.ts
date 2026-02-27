import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service";
import { IUser } from "../models/user.model";
import { HttpError } from "../errors/http-error";

export class DashboardController {
    private dashboardService: DashboardService;

    constructor() {
        this.dashboardService = new DashboardService();
    }

    getMusicianDashboard = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as IUser;
            const userId = user._id.toString();

            const data = await this.dashboardService.getMusicianDashboardStats(userId);
            if (!data) {
                throw new HttpError(404, "Musician profile not found");
            }

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    };

    getOrganizerDashboard = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as IUser;
            const userId = user._id.toString();

            const data = await this.dashboardService.getOrganizerDashboardStats(userId);
            if (!data) {
                throw new HttpError(404, "Organizer profile not found");
            }

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    };
}
