import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.patch('/:commentId', (req, res, next) => commentController.updateComment(req, res, next));
router.delete('/:commentId', (req, res, next) => commentController.deleteComment(req, res, next));

export default router;
