import { Request, Response } from "express";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";

/**
 * GET /users/
 * Equivalent of app/routers/user_router.py -> get_user
 *
 * NOTE: The original comment claimed "get_current_user already fetched the
 * user from the DB", but in the actual Python code get_current_user only
 * ever decoded the JWT and returned {"id": ...} - it never queried the
 * database. To make this endpoint actually useful (and match the doc
 * comment's intent) we fetch the full user record here.
 */
export async function getUser(req: Request, res: Response): Promise<void> {
  const userId = req.currentUser!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { deviceAssociations: true } },
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    status: "success",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      company_name: user.companyName,
      role: user.role,
      is_active: user.isActive,
      deviceCount: user._count.deviceAssociations,
      createdAt: user.createdAt,
    },
  });
}

