import { Request, Response } from "express";
import { uploadService } from "../services/upload.service";
import { ApiError } from "../utils/ApiError";

export class UploadController {
  /**
   * POST /api/uploads/initiate
   */
  async initiate(req: Request, res: Response) {
    const userId = req.user!.id;
    const { filename, mimeType, fileSize, folderId } = req.body;

    if (!filename || typeof filename !== "string") {
      throw ApiError.badRequest("Filename is required");
    }

    if (!fileSize || typeof fileSize !== "number" || fileSize <= 0) {
      throw ApiError.badRequest("Valid file size in bytes is required");
    }

    const session = await uploadService.initiateUpload(userId, {
      filename,
      mimeType: mimeType || "application/octet-stream",
      fileSize,
      folderId: folderId || null,
    });

    res.status(201).json({
      success: true,
      data: session,
    });
  }

  /**
   * GET /api/uploads/:id/parts/:partNumber/url
   */
  async getPartUrl(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const partNumber = req.params.partNumber as string;

    const parsedPartNumber = parseInt(partNumber, 10);
    if (isNaN(parsedPartNumber) || parsedPartNumber < 1) {
      throw ApiError.badRequest("Invalid part number");
    }

    const result = await uploadService.getPartUrl(userId, id, parsedPartNumber);
    res.json({
      success: true,
      data: result,
    });
  }

  /**
   * POST /api/uploads/:id/parts/:partNumber/complete
   */
  async recordPart(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const partNumber = req.params.partNumber as string;
    const { etag, size } = req.body;

    const parsedPartNumber = parseInt(partNumber, 10);
    if (isNaN(parsedPartNumber) || parsedPartNumber < 1) {
      throw ApiError.badRequest("Invalid part number");
    }

    if (!etag) {
      throw ApiError.badRequest("Part ETag is required");
    }

    const part = await uploadService.recordPart(userId, id, {
      partNumber: parsedPartNumber,
      etag,
      size: typeof size === "number" ? size : 0,
    });

    res.json({
      success: true,
      data: part,
    });
  }

  /**
   * GET /api/uploads/:id/status
   */
  async getStatus(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const status = await uploadService.getSessionStatus(userId, id);
    res.json({
      success: true,
      data: status,
    });
  }

  /**
   * POST /api/uploads/:id/complete
   */
  async complete(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { folderId, parts } = req.body;

    const file = await uploadService.completeUpload(userId, id, {
      folderId,
      parts,
    });

    res.json({
      success: true,
      data: file,
      message: "File uploaded successfully",
    });
  }

  /**
   * DELETE /api/uploads/:id
   */
  async abort(req: Request, res: Response) {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const result = await uploadService.abortUpload(userId, id);
    res.json(result);
  }

  /**
   * POST /api/uploads/direct
   * Single file direct stream upload
   */
  async directUpload(req: Request, res: Response) {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      throw ApiError.badRequest("No file provided");
    }

    const folderId = req.body.folderId || null;
    const newFile = await uploadService.directUpload(userId, file, folderId);

    res.status(201).json({
      success: true,
      data: newFile,
      message: "File uploaded directly",
    });
  }
}

export const uploadController = new UploadController();
