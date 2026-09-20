import { Router } from "express";
import multer from "multer";
import { uploadController } from "../controllers/upload.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max for direct single-request upload
});

// All upload routes require authentication
router.use(requireAuth);

// Direct single-file upload (supports Drag & Drop and direct file selection)
router.post(
  "/direct",
  upload.single("file"),
  asyncHandler((req, res) => uploadController.directUpload(req, res))
);

// Resumable Chunked Multipart Upload Protocol
router.post(
  "/initiate",
  asyncHandler((req, res) => uploadController.initiate(req, res))
);

router.get(
  "/:id/status",
  asyncHandler((req, res) => uploadController.getStatus(req, res))
);

router.get(
  "/:id/parts/:partNumber/url",
  asyncHandler((req, res) => uploadController.getPartUrl(req, res))
);

router.post(
  "/:id/parts/:partNumber/complete",
  asyncHandler((req, res) => uploadController.recordPart(req, res))
);

router.post(
  "/:id/complete",
  asyncHandler((req, res) => uploadController.complete(req, res))
);

router.delete(
  "/:id",
  asyncHandler((req, res) => uploadController.abort(req, res))
);

export default router;
