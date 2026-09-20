import { Router } from "express";
import { trashController } from "../controllers/trash.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", (req, res, next) => trashController.list(req, res).catch(next));
router.delete("/empty", (req, res, next) => trashController.empty(req, res).catch(next));
router.post("/files/:id/restore", (req, res, next) => trashController.restoreFile(req, res).catch(next));
router.delete("/files/:id/permanent", (req, res, next) => trashController.permanentDeleteFile(req, res).catch(next));
router.post("/folders/:id/restore", (req, res, next) => trashController.restoreFolder(req, res).catch(next));
router.delete("/folders/:id/permanent", (req, res, next) => trashController.permanentDeleteFolder(req, res).catch(next));

export default router;
