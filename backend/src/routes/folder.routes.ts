import { Router } from "express";
import { folderController } from "../controllers/folder.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", (req, res, next) => folderController.create(req, res).catch(next));
router.get("/:id/contents", (req, res, next) => folderController.getContents(req, res).catch(next));
router.get("/:id", (req, res, next) => folderController.get(req, res).catch(next));
router.patch("/:id/rename", (req, res, next) => folderController.rename(req, res).catch(next));
router.patch("/:id/move", (req, res, next) => folderController.move(req, res).catch(next));
router.delete("/:id", (req, res, next) => folderController.delete(req, res).catch(next));

export default router;
