import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/user.model";
import { HttpError } from "../errors/http-error";

export const rolesMiddleWare =
  (...allowedRoles: Array<"musician" | "organizer" | "admin">) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as IUser;

      if (!user) {
        throw new HttpError(401, "Unauthorized: User not authenticated");
      }

      if (!allowedRoles.includes(user.role)) {
        throw new HttpError(
          403,
          `Forbidden: This action requires one of the following roles: ${allowedRoles.join(", ")}`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

// Convenience middleware for common role combinations
export const musicianOnly = rolesMiddleWare("musician");
export const organizerOnly = rolesMiddleWare("organizer");
export const adminOnly = rolesMiddleWare("admin");
export const musicianOrOrganizer = rolesMiddleWare("musician", "organizer");
export const anyAuthenticatedUser = rolesMiddleWare(
  "musician",
  "organizer",
  "admin",
);
