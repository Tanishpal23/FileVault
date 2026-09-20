import { Router } from "express";
import { searchController } from "../controllers/search.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", (req, res, next) => searchController.search(req, res).catch(next));
router.get("/recent", (req, res, next) => searchController.getRecent(req, res).catch(next));
router.get("/starred", (req, res, next) => searchController.getStarred(req, res).catch(next));

export default router;
