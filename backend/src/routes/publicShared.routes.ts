import { Router } from "express";
import { sharingController } from "../controllers/sharing.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Public endpoints (no login session required)
router.get(
  "/:token",
  asyncHandler((req, res) => sharingController.getPublicDetails(req, res))
);

router.post(
  "/:token/verify",
  asyncHandler((req, res) => sharingController.verifyPassword(req, res))
);

router.get(
  "/:token/download",
  asyncHandler((req, res) => sharingController.downloadPublic(req, res))
);

export default router;
