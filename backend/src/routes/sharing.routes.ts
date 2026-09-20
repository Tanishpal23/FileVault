import { Router } from "express";
import { sharingController } from "../controllers/sharing.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Aggregated shares for user
router.get(
  "/with-me",
  asyncHandler((req, res) => sharingController.getSharedWithMe(req, res))
);

router.get(
  "/by-me",
  asyncHandler((req, res) => sharingController.getSharedByMe(req, res))
);

// Collaborator permissions on a file
router.post(
  "/:id/share",
  asyncHandler((req, res) => sharingController.invite(req, res))
);

router.get(
  "/:id/shares",
  asyncHandler((req, res) => sharingController.getCollaborators(req, res))
);

router.patch(
  "/:id/shares/:userId",
  asyncHandler((req, res) => sharingController.updateRole(req, res))
);

router.delete(
  "/:id/shares/:userId",
  asyncHandler((req, res) => sharingController.removeCollaborator(req, res))
);

// Public links for a file
router.post(
  "/:id/links",
  asyncHandler((req, res) => sharingController.createLink(req, res))
);

router.get(
  "/:id/links",
  asyncHandler((req, res) => sharingController.getLinks(req, res))
);

router.delete(
  "/:id/links/:linkId",
  asyncHandler((req, res) => sharingController.revokeLink(req, res))
);

export default router;
