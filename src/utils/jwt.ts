import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { ENV } from "../config/env.js"; 

export function signToken(
  payload: object,
  expiresIn: SignOptions['expiresIn'] = "1h"
): string {
  if (!ENV.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, ENV.JWT_SECRET as string, options);
}

export function verifyToken<T = object>(token: string): T {
  if (!ENV.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.verify(token, ENV.JWT_SECRET as string) as T;
}
