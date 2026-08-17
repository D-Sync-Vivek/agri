import { ApiError } from "../utils/ApiError";
import { UserCreate } from "../schemas/userSchema";
import * as userRepository from "./userRepository";
import { getPasswordHash, verifyPassword } from "../utils/security";
import { createAccessToken } from "../utils/jwtHandler";

/**
 * Equivalent of app/services/auth_service.py -> register_new_user
 */
export async function registerNewUser(userIn: UserCreate) {
  const existingUser = await userRepository.getUserByEmail(userIn.email);
  if (existingUser) {
    throw new ApiError(400, "Email already registered.");
  }

  const hashedPassword = await getPasswordHash(userIn.password);
  const newUser = await userRepository.createUser(userIn, hashedPassword);
  return newUser;
}

/**
 * Equivalent of app/services/auth_service.py -> authenticate_user
 */
export async function authenticateUser(email: string, password: string) {
  const user = await userRepository.getUserByEmail(email);
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const passwordOk = await verifyPassword(password, user.passwordHash ?? "");
  if (!passwordOk) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = createAccessToken({ sub: String(user.id) });

  return {
    access_token: accessToken,
    token_type: "bearer",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}


