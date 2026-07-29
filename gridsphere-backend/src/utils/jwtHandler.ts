import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config/env";

export interface JwtPayload {
  sub: string;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Equivalent of app/utils/jwt_handler.py -> create_access_token
 * Default expiry: 7 days (60 * 24 * 7 minutes), matching the original.
 */
export function createAccessToken(data: Record<string, unknown>, expiresInMinutes?: number): string {
  const minutes = expiresInMinutes ?? config.jwt.expiresInMinutes;
  const algorithm = (config.jwt.algorithm || "HS256") as jwt.Algorithm;
  const options: SignOptions = {
    algorithm,
    expiresIn: minutes * 60, // seconds
  };
  return jwt.sign({ ...data }, config.jwt.secret, options);
}

/**
 * Equivalent of the jwt.decode(...) call inside app/dependencies.py -> get_current_user
 */
export function verifyAccessToken(token: string): JwtPayload {
  const algorithm = (config.jwt.algorithm || "HS256") as jwt.Algorithm;
  return jwt.verify(token, config.jwt.secret, {
    algorithms: [algorithm],
  }) as JwtPayload;
}
