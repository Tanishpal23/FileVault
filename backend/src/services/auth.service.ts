import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";

export class AuthService {
  async register(data: { name: string; email: string; password: string }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw ApiError.conflict("An account with this email already exists.", "EMAIL_IN_USE");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await userRepository.create({
      name: data.name.trim(),
      email: data.email.trim(),
      passwordHash,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.name);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        storageQuota: user.storageQuota.toString(),
        storageUsed: user.storageUsed.toString(),
      },
      ...tokens,
    };
  }

  async login(data: { email: string; password: string; userAgent?: string; ipAddress?: string }) {
    const user = await userRepository.findByEmail(data.email);
    if (!user || !user.passwordHash) {
      // Avoid revealing whether user exists
      throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatches) {
      throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.name,
      data.userAgent,
      data.ipAddress
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        storageQuota: user.storageQuota.toString(),
        storageUsed: user.storageUsed.toString(),
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw ApiError.unauthorized("Missing refresh token", "NO_REFRESH_TOKEN");
    }

    const session = await userRepository.findSession(refreshToken);
    if (!session || new Date() > session.expiresAt) {
      if (session) {
        await userRepository.deleteSession(refreshToken);
      }
      throw ApiError.unauthorized("Session expired or invalid", "SESSION_EXPIRED");
    }

    // Rotate refresh token
    await userRepository.deleteSession(refreshToken);

    const tokens = await this.generateTokens(
      session.user.id,
      session.user.email,
      session.user.name,
      session.userAgent || undefined,
      session.ipAddress || undefined
    );

    return tokens;
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      await userRepository.deleteSession(refreshToken);
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    name: string,
    userAgent?: string,
    ipAddress?: string
  ) {
    const accessToken = jwt.sign(
      { userId, email, name },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await userRepository.createSession({
      userId,
      refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}

export const authService = new AuthService();
