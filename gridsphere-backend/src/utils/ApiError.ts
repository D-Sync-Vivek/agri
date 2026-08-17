/**
 * Equivalent of FastAPI's HTTPException.
 * Thrown anywhere in controllers/services and caught by the central
 * error-handling middleware (src/middleware/errorHandler.ts).
 */
export class ApiError extends Error {
  statusCode: number;
  detail: string;

  constructor(statusCode: number, detail: string) {
    super(detail);
    this.statusCode = statusCode;
    this.detail = detail;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}


