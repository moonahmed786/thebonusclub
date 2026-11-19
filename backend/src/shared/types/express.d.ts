import type { UserRole } from '../../generated/prisma/enums';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      auth?: { userId: string; sessionId: string; role: UserRole };
      partner?: { id: string; name: string };
    }
  }
}

export {};
