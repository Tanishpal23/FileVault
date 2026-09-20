import { Request, Response } from "express";
import { trashService } from "../services/trash.service";

export class TrashController {
  async list(req: Request, res: Response) {
    const result = await trashService.listTrash(req.user!.id);
    res.json({
      success: true,
      ...result,
    });
  }

  async restoreFile(req: Request, res: Response) {
    const id = req.params.id as string;
    const result = await trashService.restoreFile(req.user!.id, id);
    res.json(result);
  }

  async restoreFolder(req: Request, res: Response) {
    const id = req.params.id as string;
    const result = await trashService.restoreFolder(req.user!.id, id);
    res.json(result);
  }

  async permanentDeleteFile(req: Request, res: Response) {
    const id = req.params.id as string;
    const result = await trashService.permanentlyDeleteFile(req.user!.id, id);
    res.json(result);
  }

  async permanentDeleteFolder(req: Request, res: Response) {
    const id = req.params.id as string;
    const result = await trashService.permanentlyDeleteFolder(req.user!.id, id);
    res.json(result);
  }

  async empty(req: Request, res: Response) {
    const result = await trashService.emptyTrash(req.user!.id);
    res.json(result);
  }
}

export const trashController = new TrashController();
