import { z } from "zod";

// Equivalent of app/schemas/auth_schema.py -> LoginRequest
// NOTE: the original FastAPI /login endpoint actually used
// OAuth2PasswordRequestForm (application/x-www-form-urlencoded, field name
// "username" for the email). We preserve that exact wire behavior in
// authController.login - this schema documents the logical shape.
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// Equivalent of app/schemas/auth_schema.py -> TokenResponse
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: Record<string, unknown>;
}
