import { Request, Response, NextFunction } from "express";
import { GigService } from "../services/gig.service";
import { createGigSchema, updateGigSchema } from "../types/gig.type";
import { IUser } from "../models/user.model";

export class GigController {
  private gigService: GigService;

  constructor() {
    this.gigService = new GigService();
  }

  createGig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createGigSchema.parse(req.body);
      const user = req.user as IUser;

      const gig = await this.gigService.createGig(
        user._id.toString(),
        validatedData,
      );

      res.status(201).json({
        success: true,
        message: "Gig posted successfully",
        data: gig,
      });
    } catch (error) {
      next(error);
    }
  };

  getGigById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const gig = await this.gigService.getGigById(id);

      res.status(200).json({
        success: true,
        data: gig,
      });
    } catch (error) {
      next(error);
    }
  };

  getGigs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        title,
        location,
        genres,
        instruments,
        status,
        organizerId,
        page = "1",
        limit = "10",
      } = req.query;

      const filters = {
        title: title as string,
        location: location as string,
        genres: genres ? (genres as string).split(",") : undefined,
        instruments: instruments
          ? (instruments as string).split(",")
          : undefined,
        status: status as string,
        organizerId: organizerId as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await this.gigService.getAllGigs(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateGig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const validatedData = updateGigSchema.parse(req.body);
      const user = req.user as IUser;

      const gig = await this.gigService.updateGig(
        user._id.toString(),
        id,
        validatedData,
      );

      res.status(200).json({
        success: true,
        message: "Gig updated successfully",
        data: gig,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteGig = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = req.user as IUser;

      await this.gigService.deleteGig(user._id.toString(), id);

      res.status(200).json({
        success: true,
        message: "Gig deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
