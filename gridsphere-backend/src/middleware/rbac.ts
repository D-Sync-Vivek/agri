import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";

export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUser = req.currentUser;
      if (!currentUser) {
        return next(new ApiError(401, "Could not validate credentials"));
      }

      const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
      if (!user) {
        return next(new ApiError(401, "Could not validate credentials"));
      }

      if (user.role !== "admin" && !allowedRoles.includes(user.role)) {
        return next(new ApiError(403, "You do not have permission to perform this action"));
      }

      currentUser.role = user.role;

      next();
    } catch (err) {
      next(err);
    }
  };
}

