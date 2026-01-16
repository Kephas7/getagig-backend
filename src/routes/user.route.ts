import { Router } from "express";
import { Request, Response } from "express";
import { AuthController } from "../controllers/user.controller";
import { authorizedMiddleWare } from "../middlewares/authorized.middleware";
import { rolesMiddleWare } from "../middlewares/roles.middleware";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/me", authorizedMiddleWare, authController.getCurrentUser);

router.get(
  "/authenticate",
  authorizedMiddleWare,
  (req: Request, res: Response) => {
    res.send("User Authenticated");
  }
);
router.get(
  "/admin",
  authorizedMiddleWare,
  rolesMiddleWare("admin"),
  (req: Request, res: Response) => {
    res.send("Admin-Access granted");
  }
);
router.get(
  "/musician",
  authorizedMiddleWare,
  rolesMiddleWare("musician"),
  (req: Request, res: Response) => {
    res.send("Musician-Access granted");
  }
);
router.get(
  "/organizer",
  authorizedMiddleWare,
  rolesMiddleWare("organizer"),
  (req: Request, res: Response) => {
    res.send("Orgainzer-Access granted");
  }
);

export default router;
