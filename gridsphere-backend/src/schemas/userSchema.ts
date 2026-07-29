import { z } from "zod";

// Equivalent of app/schemas/user_schema.py -> UserCreate
// NOTE: the original schema let the client pass an arbitrary `role` on
// registration (a privilege-escalation bug - anyone could register as
// "admin"). Now that RBAC is enforced (see middleware/rbac.ts), we no
// longer accept `role` from the request; every self-registered account is
// always created with role "user" (see authService.registerNewUser).
export const UserCreateSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  phone: z.string().optional(),
});
export type UserCreate = z.infer<typeof UserCreateSchema>;

// Equivalent of app/schemas/user_schema.py -> UserResponse
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
}
