import { prisma } from "../config/database";

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        storageQuota: true,
        storageUsed: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: { email: string; name: string; passwordHash: string }) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        storageQuota: true,
        storageUsed: true,
        createdAt: true,
      },
    });
  }

  async createSession(data: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.session.create({
      data,
    });
  }

  async findSession(refreshToken: string) {
    return prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });
  }

  async deleteSession(refreshToken: string) {
    return prisma.session.deleteMany({
      where: { refreshToken },
    });
  }

  async deleteUserSessions(userId: string) {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }
}

export const userRepository = new UserRepository();
