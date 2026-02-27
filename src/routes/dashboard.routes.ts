import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authorizedMiddleWare } from "../middlewares/authorized.middleware";
import { rolesMiddleWare } from "../middlewares/roles.middleware";

const router = Router();
const dashboardController = new DashboardController();

const musicianOnly = rolesMiddleWare("musician");
const organizerOnly = rolesMiddleWare("organizer");

router.get(
    "/musician",
    authorizedMiddleWare,
    musicianOnly,
    dashboardController.getMusicianDashboard
);

router.get(
    "/organizer",
    authorizedMiddleWare,
    organizerOnly,
    dashboardController.getOrganizerDashboard
);

export default router;
