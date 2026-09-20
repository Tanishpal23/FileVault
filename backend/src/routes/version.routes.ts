import { Router } from "express";
import multer from "multer";
import { versionController } from "../controllers/version.controller";
import { requireAuth } from "../middleware/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max for direct version uploads
  },
});

const router = Router();

router.use(requireAuth);

router.get("/:id/versions", (req, res, next) =>
  versionController.list(req, res).catch(next)
);

router.post(
  "/:id/versions",
  upload.single("file"),
  (req, res, next) => versionController.uploadNewVersion(req, res).catch(next)
);

router.get("/:id/versions/:versionId/download", (req, res, next) =>
  versionController.download(req, res).catch(next)
);

router.post("/:id/versions/:versionId/restore", (req, res, next) =>
  versionController.restore(req, res).catch(next)
);

router.delete("/:id/versions/:versionId", (req, res, next) =>
  versionController.delete(req, res).catch(next)
);

export default router;
