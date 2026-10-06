import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import {
  parseOr400,
  badRequest,
  unauthorized,
  notFound,
  HttpError,
} from "../errors";
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  TOKEN_COOKIE,
} from "../auth";
import { slugify } from "../utils";

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72);

const registerSchema = z.object({
  email: z.string().email().max(120),
  password: passwordSchema,
  name: z.string().min(2).max(80),
  role: z.enum(["YOUTH", "EMPLOYER"]).default("YOUTH"),
  phone: z.string().max(15).optional(),
  district: z.string().max(60).optional(),
  state: z.string().max(60).optional(),
  organizationName: z.string().max(100).optional(),
});

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const data = parseOr400(registerSchema, req.body);
    const email = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw badRequest("An account with this email already exists");

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(data.password),
        name: data.name,
        role: data.role,
        phone: data.phone,
        district: data.district,
        state: data.state,
        profile:
          data.role === "YOUTH"
            ? { create: { district: data.district, state: data.state } }
            : undefined,
        organization:
          data.role === "EMPLOYER"
            ? {
                create: {
                  name: data.organizationName || `${data.name}'s Organization`,
                  contactEmail: email,
                  district: data.district,
                  state: data.state,
                },
              }
            : undefined,
      },
    });

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    const token = signToken(authUser);
    setAuthCookie(res, token);
    res.status(201).json({ user: authUser, token });
  } catch (e) {
    next(e);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = parseOr400(loginSchema, req.body);
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw unauthorized("Invalid email or password");
    }
    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    setAuthCookie(res, signToken(authUser));
    res.json({ user: authUser });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        district: true,
        state: true,
        profile: true,
        organization: true,
      },
    });
    if (!user) throw notFound("Account not found");
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

// Password reset request (demo: returns a reset token in response only in dev,
// and logs to audit). No email infrastructure is configured.
router.post("/forgot-password", authLimiter, async (req, res, next) => {
  try {
    const { email } = parseOr400(
      z.object({ email: z.string().email() }),
      req.body,
    );
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    // Always respond the same way to avoid account enumeration.
    res.json({
      ok: true,
      message:
        "If that email is registered, reset instructions have been created.",
    });
    if (!user) return;
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        detail: { email },
      },
    });
  } catch (e) {
    next(e);
  }
});

const resetSchema = z.object({
  email: z.string().email(),
  newPassword: passwordSchema,
});

// Dev/demo reset endpoint: requires the user's current password OR is only
// usable when NODE_ENV !== 'production'.
router.post("/reset-password", authLimiter, async (req, res, next) => {
  try {
    const body = parseOr400(resetSchema, req.body);
    if (process.env.NODE_ENV === "production")
      throw new HttpError(
        403,
        "Password reset is disabled in production; contact an administrator",
      );
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (!user) throw notFound("Account not found");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(body.newPassword) },
    });
    await prisma.auditLog.create({
      data: { userId: user.id, action: "PASSWORD_RESET_COMPLETED" },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
export { TOKEN_COOKIE, slugify };
