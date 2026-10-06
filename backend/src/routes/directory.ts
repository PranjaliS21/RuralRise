import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../auth";
import { parseOr400, notFound, forbidden } from "../errors";

export const router = Router();

/* Training directory */
export const trainingRouter = Router();
trainingRouter.get("/", async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const items = await prisma.trainingProgram.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { skills: { some: { skill: { name: { contains: q } } } } },
            ],
          }
        : {},
      include: {
        skills: { include: { skill: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

trainingRouter.get("/:slug", async (req, res, next) => {
  try {
    const t = await prisma.trainingProgram.findUnique({
      where: { slug: req.params.slug },
      include: { skills: { include: { skill: true } } },
    });
    if (!t) throw notFound("Training program not found");
    res.json({ program: t });
  } catch (e) {
    next(e);
  }
});

/* Enrollments */
const enrollSchema = z.object({ trainingProgramId: z.string().min(1) });

router.post("/enroll", requireAuth, async (req, res, next) => {
  try {
    const data = parseOr400(enrollSchema, req.body);
    const prog = await prisma.trainingProgram.findUnique({
      where: { id: data.trainingProgramId },
    });
    if (!prog) throw notFound("Training program not found");
    const existing = await prisma.trainingEnrollment.findUnique({
      where: {
        trainingProgramId_userId: {
          trainingProgramId: prog.id,
          userId: req.auth!.id,
        },
      },
    });
    const enrollment =
      existing ??
      (await prisma.trainingEnrollment.create({
        data: { trainingProgramId: prog.id, userId: req.auth!.id },
      }));
    res.status(existing ? 200 : 201).json({ enrollment });
  } catch (e) {
    next(e);
  }
});

router.patch("/enroll/:id/progress", requireAuth, async (req, res, next) => {
  try {
    const { progress } = parseOr400(
      z.object({ progress: z.number().int().min(0).max(100) }),
      req.body,
    );
    const enroll = await prisma.trainingEnrollment.findUnique({
      where: { id: req.params.id },
    });
    if (!enroll || enroll.userId !== req.auth!.id)
      throw notFound("Enrollment not found");
    const updated = await prisma.trainingEnrollment.update({
      where: { id: enroll.id },
      data: { progress, completed: progress >= 100 },
    });
    res.json({ enrollment: updated });
  } catch (e) {
    next(e);
  }
});

router.get("/enrollments", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.trainingEnrollment.findMany({
      where: { userId: req.auth!.id },
      include: { trainingProgram: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

/* Schemes directory */
export const schemesRouter = Router();
schemesRouter.get("/", async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const category = req.query.category as string | undefined;
    const items = await prisma.scheme.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { title: { contains: q } },
                  { description: { contains: q } },
                  { ministry: { contains: q } },
                ],
              }
            : {},
          category ? { category } : {},
        ].filter((x) => Object.keys(x).length > 0),
      },
      orderBy: { title: "asc" },
      take: 100,
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});
schemesRouter.get("/:slug", async (req, res, next) => {
  try {
    const s = await prisma.scheme.findUnique({
      where: { slug: req.params.slug },
    });
    if (!s) throw notFound("Scheme not found");
    res.json({ scheme: s });
  } catch (e) {
    next(e);
  }
});

/* Business ideas + planner */
export const businessRouter = Router();

businessRouter.get("/ideas", async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const skill = (req.query.skill as string | undefined)?.trim().toLowerCase();
    let items = await prisma.businessIdea.findMany({
      where: q
        ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] }
        : {},
      include: { category: true },
      take: 100,
    });
    if (skill)
      items = items.filter((i) =>
        i.skills.some((s) => s.toLowerCase().includes(skill)),
      );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

const planSchema = z.object({
  ideaId: z.string().optional(),
  title: z.string().min(2).max(120),
  targetCustomers: z.string().max(600).optional(),
  resources: z.string().max(600).optional(),
  startupCost: z.string().max(200).optional(),
  pricingNotes: z.string().max(600).optional(),
  marketingPlan: z.string().max(600).optional(),
  milestones: z
    .array(
      z.object({
        label: z.string().max(120),
        done: z.boolean().default(false),
      }),
    )
    .max(12)
    .default([]),
});

businessRouter.get("/plans", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.businessPlan.findMany({
      where: { userId: req.auth!.id },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

businessRouter.post("/plans", requireAuth, async (req, res, next) => {
  try {
    const data = parseOr400(planSchema, req.body);
    const plan = await prisma.businessPlan.create({
      data: { ...data, userId: req.auth!.id },
    });
    res.status(201).json({ plan });
  } catch (e) {
    next(e);
  }
});

businessRouter.put("/plans/:id", requireAuth, async (req, res, next) => {
  try {
    const data = parseOr400(planSchema.partial(), req.body);
    const plan = await prisma.businessPlan.findUnique({
      where: { id: req.params.id },
    });
    if (!plan || plan.userId !== req.auth!.id) throw notFound("Plan not found");
    const updated = await prisma.businessPlan.update({
      where: { id: plan.id },
      data,
    });
    res.json({ plan: updated });
  } catch (e) {
    next(e);
  }
});

businessRouter.delete("/plans/:id", requireAuth, async (req, res, next) => {
  try {
    const plan = await prisma.businessPlan.findUnique({
      where: { id: req.params.id },
    });
    if (!plan || plan.userId !== req.auth!.id) throw notFound("Plan not found");
    await prisma.businessPlan.delete({ where: { id: plan.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/* Marketplace */
export const marketplaceRouter = Router();
const listingSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(2000),
  categorySlug: z.string().optional(),
  price: z.string().max(60).optional(),
  village: z.string().max(80).optional(),
  district: z.string().max(60).optional(),
  imageUrl: z.string().url().max(400).optional(),
  contactMethod: z.enum(["phone", "email", "whatsapp"]).default("phone"),
  contactValue: z.string().max(80).optional(),
});

marketplaceRouter.get("/", async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const category = req.query.category as string | undefined;
    const items = await prisma.marketplaceListing.findMany({
      where: {
        AND: [
          {
            status: "ACTIVE",
            verification: { in: ["VERIFIED", "PENDING", "DEMO"] as unknown as string[] },
          },
          q
            ? {
                OR: [
                  { title: { contains: q } },
                  { description: { contains: q } },
                ],
              }
            : {},
          category ? { category: { slug: category } } : {},
        ].filter((x) => Object.keys(x).length > 0) as never,
      },
      include: {
        category: true,
        seller: { select: { name: true, district: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

marketplaceRouter.post(
  "/",
  requireRole("EMPLOYER", "YOUTH"),
  async (req, res, next) => {
    try {
      const data = parseOr400(listingSchema, req.body);
      let categoryId: string | undefined;
      if (data.categorySlug) {
        const cat = await prisma.category.findUnique({
          where: { slug: data.categorySlug },
        });
        categoryId = cat?.id;
      }
      const listing = await prisma.marketplaceListing.create({
        data: {
          sellerId: req.auth!.id,
          title: data.title,
          description: data.description,
          categoryId,
          price: data.price,
          village: data.village,
          district: data.district,
          imageUrl: data.imageUrl,
          contactMethod: data.contactMethod,
          contactValue: data.contactValue,
        },
      });
      res
        .status(201)
        .json({ listing, message: "Listing submitted for review" });
    } catch (e) {
      next(e);
    }
  },
);

marketplaceRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.marketplaceListing.findMany({
      where: { sellerId: req.auth!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});
