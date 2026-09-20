import { Request, Response, NextFunction } from 'express';
import { commentService } from '../services/comment.service';

export class CommentController {
  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = req.params.fileId as string;
      const userId = req.user?.id;

      const comments = await commentService.getComments(fileId, userId);
      res.json({
        success: true,
        data: comments,
      });
    } catch (err) {
      next(err);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = req.params.fileId as string;
      const userId = req.user!.id;
      const { content } = req.body;

      const comment = await commentService.addComment(fileId, userId, content);
      res.status(201).json({
        success: true,
        message: 'Comment posted',
        data: comment,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;
      const userId = req.user!.id;
      const { content } = req.body;

      const updated = await commentService.updateComment(commentId, userId, content);
      res.json({
        success: true,
        message: 'Comment updated',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;
      const userId = req.user!.id;

      await commentService.deleteComment(commentId, userId);
      res.json({
        success: true,
        message: 'Comment deleted',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const commentController = new CommentController();
