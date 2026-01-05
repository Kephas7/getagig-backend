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
} // creating a tag for user
// can use req.user after this

export async function authorizedMiddleWare(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // express function can have next function to go to next
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      throw new HttpError(401, "Unauthorized, No Bearer Token");

    const token = authHeader.split(" ")[1]; // "Bearer <token" 0 -> Bearer , 1 -> token
    if (!token) throw new HttpError(401, "Unauthorized, Missing Token");

    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, any>; // decoded -> payload
    if (!decoded || !decoded.id)
      throw new HttpError(401, "Unauthorized, Invalid Token");

    const user = await userRepository.getUserById(decoded.id); // make function async
    if (!user) throw new HttpError(401, "Unauthorized, User Not Found");

    req.user = user;
    return next();
  } catch (err: Error | any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message || "Unauthorized" });
  }
  // if(req.headers && req.headers.authorization){
  //     return next();
  // }
  // return res.status(401).json(
  //     { success: false, message: "Unauthorized" }
  // )
}

export async function adminMiddleWare(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized, User not found");

    if (req.user.role !== "admin") {
      throw new HttpError(403, "Forbidden, Admin only");
    }
    return next();
  } catch (err: Error | any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message || "Unauthorized" });
  }
}
