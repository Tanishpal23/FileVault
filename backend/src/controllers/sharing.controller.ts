import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { sharingService } from "../services/sharing.service";
import { ApiError } from "../utils/ApiError";

export class SharingController {
  /**
   * POST /api/files/:id/share
   */
  async invite(req: Request, res: Response) {
    const actorId = req.user!.id;
    const fileId = req.params.id as string;
    const { email, role } = req.body;

    if (!email || typeof email !== "string") {
      throw ApiError.badRequest("Email is required");
    }

    const assignedRole = role ? (role.toUpperCase() as Role) : Role.VIEWER;
    if (!Object.values(Role).includes(assignedRole)) {
      throw ApiError.badRequest("Invalid role specified");
    }

    const permission = await sharingService.inviteUser(actorId, fileId, {
      email,
      role: assignedRole,
    });

    res.status(201).json({
      success: true,
      data: permission,
      message: `File shared with ${email} as ${assignedRole}`,
    });
  }

  /**
   * GET /api/files/:id/shares
   */
  async getCollaborators(req: Request, res: Response) {
    const actorId = req.user!.id;
    const fileId = req.params.id as string;

    const data = await sharingService.listCollaborators(actorId, fileId);
    res.json({
      success: true,
      data,
    });
  }

  /**
   * PATCH /api/files/:id/shares/:userId
   */
  async updateRole(req: Request, res: Response) {
    const actorId = req.user!.id;
    const fileId = req.params.id as string;
    const targetUserId = req.params.userId as string;
    const { role } = req.body;

    const assignedRole = role ? (role.toUpperCase() as Role) : Role.VIEWER;
    if (!Object.values(Role).includes(assignedRole)) {
      throw ApiError.badRequest("Invalid role specified");
    }

    const permission = await sharingService.updateCollaboratorRole(
      actorId,
      fileId,
      targetUserId,
      assignedRole
    );

    res.json({
      success: true,
      data: permission,
      message: "Role updated successfully",
    });
  }

  /**
   * DELETE /api/files/:id/shares/:userId
   */
  async removeCollaborator(req: Request, res: Response) {
    const actorId = req.user!.id;
    const fileId = req.params.id as string;
    const targetUserId = req.params.userId as string;

    const result = await sharingService.removeCollaborator(actorId, fileId, targetUserId);
    res.json(result);
  }

  /**
   * GET /api/shares/with-me
   */
  async getSharedWithMe(req: Request, res: Response) {
    const userId = req.user!.id;
    const files = await sharingService.getSharedWithMe(userId);
    res.json({
      success: true,
      data: files,
    });
  }

  /**
   * GET /api/shares/by-me
   */
  async getSharedByMe(req: Request, res: Response) {
    const userId = req.user!.id;
    const files = await sharingService.getSharedByMe(userId);
    res.json({
      success: true,
      data: files,
    });
  }

  /**
   * POST /api/files/:id/links
   */
  async createLink(req: Request, res: Response) {
    const actorId = req.user!.id;
    const fileId = req.params.id as string;
    const { role, password, expiresAt, downloadLimit } = req.body;

    const link = await sharingService.createShareLink(actorId, fileId, {
      role: role ? (role.toUpperCase() as Role) : Role.VIEWER,
      password,
      expiresAt,
      downloadLimit: typeof downloadLimit === "number" ? downloadLimit : null,
    });

    res.status(201).json({
      success: true,
      data: link,
      message: "Share link created",
    });
  }

  /**
   * GET /api/files/:id/links
   */
  async getLinks(req: Request, res: Response) {
    const actorId = req.user!.id;
    const fileId = req.params.id as string;

    const links = await sharingService.listShareLinks(actorId, fileId);
    res.json({
      success: true,
      data: links,
    });
  }

  /**
   * DELETE /api/files/:id/links/:linkId
   */
  async revokeLink(req: Request, res: Response) {
    const actorId = req.user!.id;
    const fileId = req.params.id as string;
    const linkId = req.params.linkId as string;

    const result = await sharingService.revokeShareLink(actorId, fileId, linkId);
    res.json(result);
  }

  /**
   * Public: GET /api/shared/:token
   */
  async getPublicDetails(req: Request, res: Response) {
    const token = req.params.token as string;
    const details = await sharingService.getPublicLinkDetails(token);
    res.json({
      success: true,
      data: details,
    });
  }

  /**
   * Public: POST /api/shared/:token/verify
   */
  async verifyPassword(req: Request, res: Response) {
    const token = req.params.token as string;
    const { password } = req.body;

    const result = await sharingService.verifyPublicLinkPassword(token, password);
    res.json(result);
  }

  /**
   * Public: GET /api/shared/:token/download
   */
  async downloadPublic(req: Request, res: Response) {
    const token = req.params.token as string;
    const password = (req.query.password as string) || req.headers["x-share-password"] as string;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await sharingService.downloadPublicSharedFile(
      token,
      password,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      data: result,
    });
  }
}

export const sharingController = new SharingController();
