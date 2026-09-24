import { Router } from "express";
import { fileController } from "../controllers/file.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", (req, res, next) => fileController.list(req, res).catch(next));
router.get("/:id", (req, res, next) => fileController.get(req, res).catch(next));
router.patch("/:id/rename", (req, res, next) => fileController.rename(req, res).catch(next));
router.patch("/:id/move", (req, res, next) => fileController.move(req, res).catch(next));
router.delete("/:id", (req, res, next) => fileController.delete(req, res).catch(next));
router.post("/:id/star", (req, res, next) => fileController.toggleStar(req, res).catch(next));
router.get("/:id/download", (req, res, next) => fileController.download(req, res).catch(next));
router.get("/:id/content", (req, res, next) => fileController.getContent(req, res).catch(next));

export default router;
