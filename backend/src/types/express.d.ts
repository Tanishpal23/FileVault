export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  storageQuota: bigint | string;
  storageUsed: bigint | string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}
