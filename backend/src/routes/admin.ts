import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../auth";
import { parseOr400, notFound, forbidden, badRequest } from "../errors";
import { uniqueSlug } from "../utils";

export const skillsRouter = Router();
skillsRouter.get("/", async (_req, res, next) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { opportunities: true } } },
    });
    res.json({ skills });
  } catch (e) {
    next(e);
  }
});

export const notificationsRouter = Router();
notificationsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.notification.findMany({
      where: { userId: req.auth!.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const unread = items.filter((n) => !n.read).length;
    res.json({ items, unread });
  } catch (e) {
    next(e);
  }
});
notificationsRouter.post("/read-all", requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.auth!.id, read: false },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export const adminRouter = Router();
adminRouter.use(requireRole("ADMIN"));

adminRouter.get("/overview", async (_req, res, next) => {
  try {
    const [
      users,
      youth,
      employers,
      opps,
      pending,
      apps,
      listings,
      enrollments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "YOUTH" } }),
      prisma.user.count({ where: { role: "EMPLOYER" } }),
      prisma.opportunity.count(),
      prisma.opportunity.count({ where: { verification: "PENDING" } }),
      prisma.application.count(),
      prisma.marketplaceListing.count({ where: { verification: "PENDING" } }),
      prisma.trainingEnrollment.count(),
    ]);
    res.json({
      users,
      youth,
      employers,
      opportunities: opps,
      pendingOpportunities: pending,
      applications: apps,
      pendingListings: listings,
      enrollments,
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/review-queue", async (_req, res, next) => {
  try {
    const [opportunities, listings] = await Promise.all([
      prisma.opportunity.findMany({
        where: { verification: "PENDING" },
        include: { category: true, organization: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.marketplaceListing.findMany({
        where: { verification: "PENDING" },
        include: { seller: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    res.json({ opportunities, listings });
  } catch (e) {
    next(e);
  }
});

const decisionSchema = z.object({
  entityType: z.enum(["OPPORTUNITY", "MARKETPLACE", "ORGANIZATION"]),
  entityId: z.string().min(1),
  action: z.enum(["VERIFIED", "REJECTED"]),
  reason: z.string().max(500).optional(),
});

adminRouter.post("/review", async (req, res, next) => {
  try {
    const data = parseOr400(decisionSchema, req.body);
    const isVerify = data.action === "VERIFIED";
    if (data.entityType === "OPPORTUNITY") {
      const opp = await prisma.opportunity.findUnique({
        where: { id: data.entityId },
      });
      if (!opp) throw notFound("Opportunity not found");
      await prisma.opportunity.update({
        where: { id: opp.id },
        data: {
          verification: isVerify ? "VERIFIED" : "REJECTED",
          verificationNote: data.reason,
          isDemo: false,
        },
      });
    } else if (data.entityType === "MARKETPLACE") {
      const listing = await prisma.marketplaceListing.findUnique({
        where: { id: data.entityId },
      });
      if (!listing) throw notFound("Listing not found");
      await prisma.marketplaceListing.update({
        where: { id: listing.id },
        data: {
          verification: isVerify ? "VERIFIED" : "REJECTED",
          status: isVerify ? "ACTIVE" : "REMOVED",
        },
      });
    } else {
      const org = await prisma.organization.findUnique({
        where: { id: data.entityId },
      });
      if (!org) throw notFound("Organization not found");
      await prisma.organization.update({
        where: { id: org.id },
        data: { verified: isVerify },
      });
    }
    await prisma.verificationReview.create({
      data: {
        adminId: req.auth!.id,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        reason: data.reason,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.id,
        action: `ADMIN_${data.action}_${data.entityType}`,
        detail: { entityId: data.entityId, reason: data.reason },
      },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/users", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;
    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          district: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
});

const userActionSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["YOUTH", "EMPLOYER", "ADMIN"]).optional(),
  deleteUser: z.boolean().optional(),
});

adminRouter.post("/users", async (req, res, next) => {
  try {
    const data = parseOr400(userActionSchema, req.body);
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw notFound("User not found");
    if (data.deleteUser) {
      if (user.id === req.auth!.id)
        throw badRequest("You cannot delete your own admin account");
      await prisma.user.delete({ where: { id: user.id } });
    } else if (data.role) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: data.role },
      });
    }
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.id,
        action: data.deleteUser ? "ADMIN_DELETE_USER" : "ADMIN_CHANGE_ROLE",
        detail: { target: user.email },
      },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/categories", async (_req, res, next) => {
  try {
    res.json({
      categories: await prisma.category.findMany({ orderBy: { name: "asc" } }),
    });
  } catch (e) {
    next(e);
  }
});

const categorySchema = z.object({
  name: z.string().min(2).max(60),
  icon: z.string().max(30).default("briefcase"),
  description: z.string().max(200).optional(),
});
adminRouter.post("/categories", async (req, res, next) => {
  try {
    const data = parseOr400(categorySchema, req.body);
    const slug = await uniqueSlug(data.name, (s) =>
      prisma.category.findUnique({ where: { slug: s } }).then((x) => !!x),
    );
    const cat = await prisma.category.create({ data: { ...data, slug } });
    res.status(201).json({ category: cat });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/expired", async (_req, res, next) => {
  try {
    const items = await prisma.opportunity.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { expiresAt: { lt: new Date() } },
          { deadline: { lt: new Date() } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        expiresAt: true,
        deadline: true,
      },
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/expired/expire", async (req, res, next) => {
  try {
    const { ids } = parseOr400(
      z.object({ ids: z.array(z.string()).min(1) }),
      req.body,
    );
    const r = await prisma.opportunity.updateMany({
      where: { id: { in: ids } },
      data: { status: "EXPIRED" },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.id,
        action: "ADMIN_EXPIRE_LISTINGS",
        detail: { ids },
      },
    });
    res.json({ expired: r.count });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/audit-logs", async (_req, res, next) => {
  try {
    const items = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});
