import { Router } from "express";
import { OrganizerController } from "../controllers/organizer.controller";
import {
  uploadSingle,
  uploadPhotos,
  uploadVideos,
  uploadDocuments,
} from "../middlewares/upload.middleware";
import {
  authorizedMiddleWare,
  adminMiddleWare,
} from "../middlewares/authorized.middleware";
import { rolesMiddleWare } from "../middlewares/roles.middleware";

const router = Router();
const organizerController = new OrganizerController();

const organizerOnly = rolesMiddleWare("organizer");

router.post(
  "/profile",
  authorizedMiddleWare,
  organizerOnly,
  organizerController.createProfile,
);

router.get(
  "/profile",
  authorizedMiddleWare,
  organizerOnly,
  organizerController.getOwnProfile,
);

router.put(
  "/profile",
  authorizedMiddleWare,
  organizerOnly,
  organizerController.updateProfile,
);

router.delete(
  "/profile",
  authorizedMiddleWare,
  organizerOnly,
  organizerController.deleteProfile,
);

router.get("/profile/:id", organizerController.getProfileById);
router.get("/search", organizerController.searchOrganizers);

router.patch(
  "/active-status",
  authorizedMiddleWare,
  organizerOnly,
  organizerController.updateActiveStatus,
);

router.patch(
  "/verify",
  authorizedMiddleWare,
  adminMiddleWare,
  organizerController.updateVerification,
);

router.post(
  "/profile-picture",
  authorizedMiddleWare,
  organizerOnly,
  uploadSingle,
  organizerController.uploadProfilePicture,
);

router.post(
  "/photos",
  authorizedMiddleWare,
  organizerOnly,
  uploadPhotos,
  organizerController.addPhotos,
);

router.delete(
  "/photos",
  authorizedMiddleWare,
  organizerOnly,
  organizerController.removePhoto,
);

router.post(
  "/videos",
  authorizedMiddleWare,
  organizerOnly,
  uploadVideos,
  organizerController.addVideos,
);

router.delete(
  "/videos",
  authorizedMiddleWare,
  organizerOnly,
  organizerController.removeVideo,
);

router.post(
  "/verification-documents",
  authorizedMiddleWare,
  organizerOnly,
  uploadDocuments,
  organizerController.addVerificationDocuments,
);

router.delete(
  "/verification-documents",
  authorizedMiddleWare,
  organizerOnly,
  organizerController.removeVerificationDocument,
);

export default router;
