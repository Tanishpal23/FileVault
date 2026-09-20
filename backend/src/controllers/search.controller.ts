import { Request, Response } from "express";
import { searchService } from "../services/search.service";

export class SearchController {
  async search(req: Request, res: Response) {
    const {
      q,
      type,
      folderId,
      minSize,
      maxSize,
      startDate,
      endDate,
      isStarred,
      limit,
      offset,
    } = req.query;

    const result = await searchService.search(req.user!.id, {
      q: q as string,
      type: type as string,
      folderId: folderId as string,
      minSize: minSize ? parseInt(minSize as string, 10) : undefined,
      maxSize: maxSize ? parseInt(maxSize as string, 10) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      isStarred: isStarred === "true",
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  }

  async getRecent(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const result = await searchService.getRecent(req.user!.id, limit);
    res.json({
      success: true,
      ...result,
    });
  }

  async getStarred(req: Request, res: Response) {
    const result = await searchService.getStarred(req.user!.id);
    res.json({
      success: true,
      ...result,
    });
  }
}

export const searchController = new SearchController();
