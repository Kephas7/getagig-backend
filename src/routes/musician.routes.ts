import { Router } from "express";
import { MusicianController } from "../controllers/musician.controller";
import {
  uploadSingle,
  uploadPhotos,
  uploadVideos,
  uploadAudio,
} from "../middlewares/upload.middleware";
import { authorizedMiddleWare } from "../middlewares/authorized.middleware";
import { rolesMiddleWare } from "../middlewares/roles.middleware";

const router = Router();
const musicianController = new MusicianController();

const musicianOnly = rolesMiddleWare("musician");

router.post(
  "/profile",
  authorizedMiddleWare,
  musicianOnly,
  musicianController.createProfile,
);

router.get(
  "/profile",
  authorizedMiddleWare,
  musicianOnly,
  musicianController.getOwnProfile,
);

router.put(
  "/profile",
  authorizedMiddleWare,
  musicianOnly,
  musicianController.updateProfile,
);

router.delete(
  "/profile",
  authorizedMiddleWare,
  musicianOnly,
  musicianController.deleteProfile,
);

router.get("/profile/:id", musicianController.getProfileById);
router.get("/search", musicianController.searchMusicians);

router.patch(
  "/availability",
  authorizedMiddleWare,
  musicianOnly,
  musicianController.updateAvailability,
);

router.post(
  "/profile-picture",
  authorizedMiddleWare,
  musicianOnly,
  uploadSingle,
  musicianController.uploadProfilePicture,
);

router.post(
  "/photos",
  authorizedMiddleWare,
  musicianOnly,
  uploadPhotos,
  musicianController.addPhotos,
);

router.delete(
  "/photos",
  authorizedMiddleWare,
  musicianOnly,
  musicianController.removePhoto,
);

router.post(
  "/videos",
  authorizedMiddleWare,
  musicianOnly,
  uploadVideos,
  musicianController.addVideos,
);

router.delete(
  "/videos",
  authorizedMiddleWare,
  musicianOnly,
  musicianController.removeVideo,
);

router.post(
  "/audio",
  authorizedMiddleWare,
  musicianOnly,
  uploadAudio,
  musicianController.addAudioSamples,
);

router.delete(
  "/audio",
  authorizedMiddleWare,
  musicianOnly,
  musicianController.removeAudioSample,
);

export default router;
