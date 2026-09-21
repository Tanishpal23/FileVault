import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { userRepository } from "../repositories/user.repository";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";

const getCookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  ...(maxAge !== undefined ? { maxAge } : {}),
});

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    res.cookie("accessToken", result.accessToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
    res.cookie("refreshToken", result.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip;

    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
      userAgent,
      ipAddress,
    });

    const refreshMaxAge = req.body.rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : 7 * 24 * 60 * 60 * 1000; // 7 days

    res.cookie("accessToken", result.accessToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
    res.cookie("refreshToken", result.refreshToken, getCookieOptions(refreshMaxAge));

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepository.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User does not exist" },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        storageUsed: user.storageUsed.toString(),
        storageQuota: user.storageQuota.toString(),
        createdAt: user.createdAt,
      },
    });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    const result = await authService.refresh(token);

    res.cookie("accessToken", result.accessToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
    res.cookie("refreshToken", result.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    await authService.logout(token);

    res.clearCookie("accessToken", getCookieOptions());
    res.clearCookie("refreshToken", getCookieOptions());

    res.status(200).json({
      success: true,
      data: { message: "Successfully logged out" },
    });
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.verifyOtp(req.body.email, req.body.otp);
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(
      req.body.email,
      req.body.otp,
      req.body.newPassword
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

export const authController = new AuthController();
