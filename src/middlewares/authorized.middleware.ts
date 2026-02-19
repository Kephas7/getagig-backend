import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { IUser } from "../models/user.model";
import { UserRepository } from "../repositories/user.repository";
import { HttpError } from "../errors/http-error";

let userRepository = new UserRepository();
declare global {
  namespace Express {
    interface Request {
      user?: Record<string, any> | IUser;
    }
  }
}

export async function authorizedMiddleWare(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      throw new HttpError(401, "Unauthorized, No Bearer Token");

    const token = authHeader.split(" ")[1];
    if (!token) throw new HttpError(401, "Unauthorized, Missing Token");

    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>;
    if (!decoded || !decoded.id)
      throw new HttpError(401, "Unauthorized, Invalid Token");

    const user = await userRepository.getUserById(decoded.id);
    if (!user) throw new HttpError(401, "Unauthorized, User Not Found");

    req.user = user;
    return next();
  } catch (err: Error | any) {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Unauthorized";

    if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      statusCode = 401;
      message = "Unauthorized, Invalid or Expired Token";
    }

    return res
      .status(statusCode)
      .json({ success: false, message });
  }
}

// Removed unused adminMiddleWare; use rolesMiddleWare("admin") or `adminOnly` from roles.middleware instead.
