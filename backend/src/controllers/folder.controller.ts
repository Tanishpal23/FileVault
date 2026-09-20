import { Request, Response } from "express";
import { folderService } from "../services/folder.service";

export class FolderController {
  async create(req: Request, res: Response) {
    const { name, parentId, color } = req.body;
    const folder = await folderService.createFolder(req.user!.id, {
      name,
      parentId,
      color,
    });
    res.status(201).json({
      success: true,
      folder,
    });
  }

  async get(req: Request, res: Response) {
    const id = req.params.id as string;
    const folder = await folderService.getFolder(req.user!.id, id);
    res.json({
      success: true,
      folder,
    });
  }

  async getContents(req: Request, res: Response) {
    const id = req.params.id as string;
    const { search, sortBy, sortOrder } = req.query;

    const contents = await folderService.getFolderContents(req.user!.id, id, {
      search: search as string,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });

    res.json({
      success: true,
      ...contents,
    });
  }

  async rename(req: Request, res: Response) {
    const id = req.params.id as string;
    const { name } = req.body;
    const folder = await folderService.renameFolder(req.user!.id, id, name);
    res.json({
      success: true,
      folder,
    });
  }

  async move(req: Request, res: Response) {
    const id = req.params.id as string;
    const { parentId } = req.body;
    const folder = await folderService.moveFolder(req.user!.id, id, parentId);
    res.json({
      success: true,
      folder,
    });
  }

  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    await folderService.deleteFolder(req.user!.id, id);
    res.json({
      success: true,
      message: "Folder and contents moved to trash",
    });
  }
}

export const folderController = new FolderController();
