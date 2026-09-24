import { Request, Response } from "express";
import { fileService } from "../services/file.service";

export class FileController {
  async list(req: Request, res: Response) {
    const { folderId, search, sortBy, sortOrder, limit, offset } = req.query;

    const result = await fileService.listFiles(req.user!.id, {
      folderId: folderId as string,
      search: search as string,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  }

  async get(req: Request, res: Response) {
    const id = req.params.id as string;
    const file = await fileService.getFile(req.user!.id, id);
    res.json({
      success: true,
      file,
    });
  }

  async rename(req: Request, res: Response) {
    const id = req.params.id as string;
    const { name } = req.body;
    const file = await fileService.renameFile(req.user!.id, id, name);
    res.json({
      success: true,
      file,
    });
  }

  async move(req: Request, res: Response) {
    const id = req.params.id as string;
    const { folderId } = req.body;
    const file = await fileService.moveFile(req.user!.id, id, folderId);
    res.json({
      success: true,
      file,
    });
  }

  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    const result = await fileService.deleteFile(req.user!.id, id);
    res.json({
      success: true,
      ...result,
    });
  }

  async toggleStar(req: Request, res: Response) {
    const id = req.params.id as string;
    const result = await fileService.toggleStar(req.user!.id, id);
    res.json({
      success: true,
      ...result,
    });
  }

  async download(req: Request, res: Response) {
    const id = req.params.id as string;
    const disposition = (req.query.disposition as "inline" | "attachment") || "attachment";
    const result = await fileService.getDownloadUrl(req.user!.id, id, disposition);
    res.json({
      success: true,
      ...result,
    });
  }

  async getContent(req: Request, res: Response) {
    const id = req.params.id as string;
    const result = await fileService.getFileContent(req.user!.id, id);
    res.json({
      success: true,
      data: result,
    });
  }
}

export const fileController = new FileController();
