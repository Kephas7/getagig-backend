import { Router } from "express";
import { ApplicationController } from "../controllers/application.controller";
import { authorizedMiddleWare } from "../middlewares/authorized.middleware";
import { rolesMiddleWare } from "../middlewares/roles.middleware";

const router = Router();
const applicationController = new ApplicationController();

// All application routes require authentication
router.use(authorizedMiddleWare);

// Musician routes
router.post("/", rolesMiddleWare("musician"), applicationController.apply);
router.get("/my-applications", rolesMiddleWare("musician"), applicationController.getMyApplications);

// Organizer routes
router.get("/gig/:gigId", rolesMiddleWare("organizer"), applicationController.getGigApplications);
router.put("/:id/status", rolesMiddleWare("organizer"), applicationController.updateStatus);

export default router;
