import { Request, Response } from "express";
import { versionService } from "../services/version.service";
import { ApiError } from "../utils/ApiError";

export class VersionController {
  async list(req: Request, res: Response) {
    const fileId = req.params.id as string;
    const result = await versionService.listVersions(req.user!.id, fileId);
    res.json({
      success: true,
      ...result,
    });
  }

  async download(req: Request, res: Response) {
    const fileId = req.params.id as string;
    const versionId = req.params.versionId as string;
    const result = await versionService.getDownloadUrl(req.user!.id, fileId, versionId);
    res.json({
      success: true,
      ...result,
    });
  }

  async restore(req: Request, res: Response) {
    const fileId = req.params.id as string;
    const versionId = req.params.versionId as string;
    const result = await versionService.restoreVersion(req.user!.id, fileId, versionId);
    res.json(result);
  }

  async delete(req: Request, res: Response) {
    const fileId = req.params.id as string;
    const versionId = req.params.versionId as string;
    const result = await versionService.deleteVersion(req.user!.id, fileId, versionId);
    res.json(result);
  }

  async uploadNewVersion(req: Request, res: Response) {
    const fileId = req.params.id as string;
    const uploadedFile = req.file;

    if (!uploadedFile) {
      throw ApiError.badRequest("No file uploaded");
    }

    const result = await versionService.uploadNewVersion(
      req.user!.id,
      fileId,
      uploadedFile.buffer,
      uploadedFile.mimetype || "application/octet-stream",
      uploadedFile.size
    );

    res.json(result);
  }
}

export const versionController = new VersionController();
