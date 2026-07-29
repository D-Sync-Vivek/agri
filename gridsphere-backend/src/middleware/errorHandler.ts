import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

/**
 * Central error-handling middleware.
 * Equivalent of FastAPI's automatic HTTPException -> JSON response conversion,
 * plus handling for Zod validation errors (equivalent of Pydantic's 422s).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ detail: err.detail });
    return;
  }

  if (err instanceof ZodError) {
    // Mirrors FastAPI/Pydantic's 422 Unprocessable Entity behavior
    res.status(422).json({ detail: err.errors });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ detail: "Internal Server Error" });
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ detail: `Route ${req.method} ${req.originalUrl} not found` });
}

/**
 * Wraps an async route handler so thrown/rejected errors are forwarded to
 * the Express error middleware (equivalent of FastAPI's automatic async
 * exception propagation).
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
