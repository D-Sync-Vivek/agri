import { Request, Response } from "express";

/**
 * GET /plans/ (note: plan_router was defined but never registered with a
 * prefix in the original app/main.py - it's included here for parity in
 * case it's mounted; see routes/index.ts for notes.)
 * Equivalent of app/routers/plan_router.py -> get_plan
 */
export async function getPlan(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ status: "success", data: { plan_type: "premium" } });
}
