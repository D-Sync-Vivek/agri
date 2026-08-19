import { Request, Response } from "express";
import { UserCreateSchema } from "../schemas/userSchema";
import * as authService from "../services/authService";

/**
 * POST /register
 * Equivalent of app/routers/auth_router.py -> register
 * Returns 201 + UserResponse shape.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const userIn = UserCreateSchema.parse(req.body);
  const newUser = await authService.registerNewUser(userIn);

  res.status(201).json({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  });
}

/**
 * POST /login
 * Equivalent of app/routers/auth_router.py -> login
 *
 * The original endpoint used FastAPI's OAuth2PasswordRequestForm, which
 * expects `application/x-www-form-urlencoded` body with fields
 * `username` (actually the email) and `password`. We preserve that exact
 * wire contract here so existing frontend/Swagger-style clients keep
 * working unchanged. (express.urlencoded() must be enabled - see app.ts.)
 */
export async function login(req: Request, res: Response): Promise<void> {
  const username = req.body.username; // Swagger UI / OAuth2 form field name, holds the email
  const password = req.body.password;

  const result = await authService.authenticateUser(username, password);
  res.status(200).json(result);
}

/**
 * POST /logout
 * Equivalent of app/routers/auth_router.py -> logout
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ status: true, message: "Logged out successfully" });
}

/**
 * GET /checkSession
 * Equivalent of app/routers/auth_router.py -> check_session
 * (Fixed bug: original read current_user["u_id"] which never existed;
 *  see middleware/auth.ts for details.)
 */
export async function checkSession(req: Request, res: Response): Promise<void> {
  res.status(200).json({ status: true, message: "Session active", user_id: req.currentUser!.id });
}


