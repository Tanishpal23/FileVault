import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { requireAuth } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// File comment endpoints: mounted at /api/files/:fileId/comments and /api/comments
router.get('/', (req, res, next) => commentController.getComments(req, res, next));
router.post('/', (req, res, next) => commentController.addComment(req, res, next));

export default router;
