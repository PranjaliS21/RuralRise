import { Router, Request } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { optionalAuth } from "../auth";
import { parseOr400, notFound } from "../errors";
import { score } from "../matching/engine";
import type { MatchResult } from "../matching/engine";

export const router = Router();

const listSchema = z.object({
  q: z.string().max(120).optional(),
  category: z.string().optional(),
  workType: z.string().optional(),
  district: z.string().optional(),
  remote: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
  sort: z.enum(["relevance", "recent", "deadline"]).default("recent"),
});

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const f = parseOr400(listSchema, req.query);
    const where = {
      status: "ACTIVE" as const,
      verification: { in: ["VERIFIED", "DEMO"] as never[] },
      AND: [
        f.category ? { category: { slug: f.category } } : {},
        f.workType ? { workType: f.workType as never } : {},
        f.district ? { district: { contains: f.district } } : {},
        f.remote ? { isRemote: true } : {},
        f.q
          ? {
              OR: [
                { title: { contains: f.q } },
                { description: { contains: f.q } },
                { skills: { some: { skill: { name: { contains: f.q } } } } },
              ],
            }
          : {},
      ].filter((c) => Object.keys(c).length > 0),
    };

    const [total, items] = await Promise.all([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({
        where,
        include: {
          category: true,
          organization: { select: { name: true, verified: true } },
          skills: { include: { skill: true } },
        },
        orderBy:
          f.sort === "recent"
            ? { publishedAt: "desc" }
            : { publishedAt: "desc" },
        skip: (f.page - 1) * f.limit,
        take: f.limit,
      }),
    ]);

    // Personalized matching when the user is a logged-in youth
    let profile: Record<string, unknown> | null = null;
    if (req.auth?.role === "YOUTH") {
      const p = await prisma.youthProfile.findUnique({
        where: { userId: req.auth.id },
      });
      if (p) profile = p as unknown as Record<string, unknown>;
    }

    const results = items.map((o) => {
      const match: MatchResult | null = profile
        ? score(profile as never, o as never, o.category.slug)
        : null;
      return { ...o, match };
    });

    if (f.sort === "relevance" && profile) {
      results.sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0));
    }

    res.json({
      items: results,
      total,
      page: f.page,
      pages: Math.ceil(total / f.limit),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:slug", optionalAuth, async (req, res, next) => {
  try {
    const o = await prisma.opportunity.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        organization: { select: { name: true, verified: true, about: true } },
        skills: { include: { skill: true } },
      },
    });
    if (!o || (o.status !== "ACTIVE" && req.auth?.role !== "ADMIN"))
      throw notFound("Opportunity not found");
    if (
      !["VERIFIED", "DEMO"].includes(o.verification) &&
      req.auth?.role !== "ADMIN" &&
      req.auth?.role !== "EMPLOYER"
    )
      throw notFound("Opportunity not found");

    await prisma.opportunity.update({
      where: { id: o.id },
      data: { viewCount: { increment: 1 } },
    });
    if (req.auth?.role === "YOUTH") {
      await prisma.opportunityView.create({
        data: { userId: req.auth.id, opportunityId: o.id },
      });
    }

    let match: MatchResult | null = null;
    if (req.auth?.role === "YOUTH") {
      const p = await prisma.youthProfile.findUnique({
        where: { userId: req.auth.id },
      });
      if (p) match = score(p as never, o as never, o.category.slug);
    }
    res.json({ opportunity: { ...o, match } });
  } catch (e) {
    next(e);
  }
});

// Save / unsave
router.post("/:id/save", async (req, res, next) => {
  try {
    if (!req.auth) throw notFound("Sign in to save opportunities");
    const { id } = req.params;
    const existing = await prisma.savedOpportunity.findUnique({
      where: {
        userId_opportunityId: { userId: req.auth.id, opportunityId: id },
      },
    });
    if (existing) {
      await prisma.savedOpportunity.delete({
        where: {
          userId_opportunityId: {
            userId: req.auth.id,
            opportunityId: id,
          },
        },
      });
      return res.json({ saved: false });
    }
    await prisma.savedOpportunity.create({
      data: { userId: req.auth.id, opportunityId: id },
    });
    res.json({ saved: true });
  } catch (e) {
    next(e);
  }
});

// Categories for filters
export const categoriesRouter = Router();
categoriesRouter.get("/", async (_req, res, next) => {
  try {
    const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json({ categories: cats });
  } catch (e) {
    next(e);
  }
});
