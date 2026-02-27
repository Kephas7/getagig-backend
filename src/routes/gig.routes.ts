import { Router } from "express";
import { GigController } from "../controllers/gig.controller";
import { authorizedMiddleWare } from "../middlewares/authorized.middleware";
import { rolesMiddleWare } from "../middlewares/roles.middleware";

const router = Router();
const gigController = new GigController();

const organizerOnly = rolesMiddleWare("organizer");

// Public routes
router.get("/", gigController.getGigs);
router.get("/:id", gigController.getGigById);

// Protected routes (Organizers only)
router.post("/", authorizedMiddleWare, organizerOnly, gigController.createGig);
router.put("/:id", authorizedMiddleWare, organizerOnly, gigController.updateGig);
router.delete("/:id", authorizedMiddleWare, organizerOnly, gigController.deleteGig);

export default router;
