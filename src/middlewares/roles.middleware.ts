import { Request, Response, NextFunction } from "express";

export const rolesMiddleWare =
  (...allowedRoles: Array<"musician" | "organizer" | "admin">) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: "Forbidden: You do not have permission",
      });
    }

    next();
  };
