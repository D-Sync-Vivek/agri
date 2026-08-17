import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwtHandler";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      // role is populated by requireRole once it looks the user up
      currentUser?: { id: number; role?: string };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Could not validate credentials"));
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    const userId = payload.sub;

    if (!userId) {
      return next(new ApiError(401, "Could not validate credentials"));
    }

    req.currentUser = { id: parseInt(userId, 10) };
    next();
  } catch (err) {
    next(new ApiError(401, "Could not validate credentials"));
  }
}

