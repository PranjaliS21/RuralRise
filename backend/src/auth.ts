import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { unauthorized, forbidden } from "./errors";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";
export const TOKEN_COOKIE = "rr_token";
const TOKEN_TTL = 7 * 24 * 3600; // 7 days in seconds

export interface AuthUser {
  id: string;
  email: string;
  role: "YOUTH" | "EMPLOYER" | "ADMIN";
  name: string;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TOKEN_TTL * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(TOKEN_COOKIE, { path: "/" });
}

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}
export function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export function readAuth(req: Request): AuthUser | undefined {
  const header = req.headers.authorization;
  let token: string | undefined;
  if (header?.startsWith("Bearer ")) token = header.slice(7);
  else if (req.cookies?.[TOKEN_COOKIE]) token = req.cookies[TOKEN_COOKIE];
  if (!token) return undefined;
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return undefined;
  }
}

// Attaches req.auth if a valid token exists; never throws.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.auth = readAuth(req);
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = readAuth(req);
  if (!auth) throw unauthorized("Please log in to continue");
  req.auth = auth;
  next();
}

export function requireRole(...roles: AuthUser["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const auth = readAuth(req);
    if (!auth) throw unauthorized("Please log in to continue");
    if (!roles.includes(auth.role))
      throw forbidden("Your account role cannot perform this action");
    req.auth = auth;
    next();
  };
}
