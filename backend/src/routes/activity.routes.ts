import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res, next) => activityController.getActivities(req, res, next));
router.get('/resource/:resourceId', (req, res, next) => activityController.getResourceActivities(req, res, next));

export default router;
