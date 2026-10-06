import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../auth";
import { parseOr400, notFound, forbidden, badRequest } from "../errors";
import { score } from "../matching/engine";
import { uniqueSlug } from "../utils";
import { authLimiter } from "./auth";

export const router = Router();

/* ---------------- Profiles (youth) ---------------- */

const profileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(15).nullable().optional(),
  education: z.string().max(80).nullable().optional(),
  village: z.string().max(80).nullable().optional(),
  district: z.string().max(60).nullable().optional(),
  state: z.string().max(60).nullable().optional(),
  preferredRadiusKm: z.number().int().min(1).max(500).optional(),
  interests: z.array(z.string().max(40)).max(15).optional(),
  skills: z.array(z.string().max(40)).max(30).optional(),
  availability: z.string().max(80).nullable().optional(),
  experience: z.string().max(600).nullable().optional(),
  languages: z.array(z.string().max(30)).max(10).optional(),
  careerGoals: z.string().max(600).nullable().optional(),
  profileVisible: z.boolean().optional(),
});

export function computeCompletion(p: {
  education?: string | null;
  district?: string | null;
  interests?: unknown;
  skills?: unknown;
  availability?: string | null;
  experience?: string | null;
  languages?: unknown;
  careerGoals?: string | null;
}): number {
  const fields = [
    !!p.education,
    !!p.district,
    Array.isArray(p.interests) && p.interests.length > 0,
    Array.isArray(p.skills) && p.skills.length > 0,
    !!p.availability,
    !!p.experience,
    Array.isArray(p.languages) && p.languages.length > 0,
    !!p.careerGoals,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

router.put("/profile", requireRole("YOUTH"), async (req, res, next) => {
  try {
    const data = parseOr400(profileSchema, req.body);
    if (
      data.name ||
      data.phone !== undefined ||
      data.district !== undefined ||
      data.state !== undefined
    ) {
      const userUpdate: Record<string, unknown> = {};
      if (data.name) userUpdate.name = data.name;
      if (data.phone !== undefined) userUpdate.phone = data.phone;
      if (data.district !== undefined) userUpdate.district = data.district;
      if (data.state !== undefined) userUpdate.state = data.state;
      await prisma.user.update({
        where: { id: req.auth!.id },
        data: userUpdate,
      });
    }
    const { name, phone, state, ...profileData } = data;
    const profile = await prisma.youthProfile.upsert({
      where: { userId: req.auth!.id },
      create: { userId: req.auth!.id, ...profileData },
      update: profileData,
    });
    const completion = computeCompletion(profile);
    await prisma.youthProfile.update({
      where: { userId: req.auth!.id },
      data: { completion },
    });
    res.json({ profile: { ...profile, completion } });
  } catch (e) {
    next(e);
  }
});

router.get("/profile", requireAuth, async (req, res, next) => {
  try {
    if (req.auth!.role === "YOUTH") {
      const profile = await prisma.youthProfile.findUnique({
        where: { userId: req.auth!.id },
      });
      return res.json({ profile });
    }
    const org = await prisma.organization.findUnique({
      where: { ownerId: req.auth!.id },
    });
    res.json({ organization: org });
  } catch (e) {
    next(e);
  }
});

// Profile deletion (privacy control)
router.delete("/profile", requireAuth, async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.auth!.id } });
    await prisma.auditLog.create({
      data: {
        action: "ACCOUNT_SELF_DELETED",
        detail: { role: req.auth!.role },
      },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/* ---------------- Youth dashboard ---------------- */

router.get("/dashboard", requireRole("YOUTH"), async (req, res, next) => {
  try {
    const userId = req.auth!.id;
    const profile = await prisma.youthProfile.findUnique({ where: { userId } });
    const [applications, saved, recentlyViewed, enrollments, skillCount] =
      await Promise.all([
        prisma.application.findMany({
          where: { userId },
          include: {
            opportunity: {
              select: {
                slug: true,
                title: true,
                district: true,
                isRemote: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        }),
        prisma.savedOpportunity.findMany({
          where: { userId },
          include: {
            opportunity: {
              select: {
                slug: true,
                title: true,
                district: true,
                isRemote: true,
                expiresAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.opportunityView.findMany({
          where: { userId },
          orderBy: { viewedAt: "desc" },
          take: 5,
          include: {
            opportunity: {
              select: {
                slug: true,
                title: true,
                district: true,
                isRemote: true,
              },
            },
          },
        }),
        prisma.trainingEnrollment.findMany({
          where: { userId },
          include: {
            trainingProgram: {
              select: {
                slug: true,
                title: true,
                providerName: true,
                duration: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.userSkill.count({ where: { userId } }),
      ]);

    // Matching pool
    const pool = await prisma.opportunity.findMany({
      where: { status: "ACTIVE", verification: { in: ["VERIFIED", "DEMO"] } },
      include: { category: true, skills: { include: { skill: true } } },
      take: 200,
    });

    let matches: Array<Record<string, unknown>> = [];
    if (profile) {
      matches = pool
        .map((o) => ({
          ...o,
          match: score(profile as never, o as never, o.category.slug),
        }))
        .sort(
          (a, b) =>
            (b.match as { score: number }).score -
            (a.match as { score: number }).score,
        )
        .slice(0, 8)
        .map((o) => ({
          id: o.id,
          slug: o.slug,
          title: o.title,
          workType: o.workType,
          isRemote: o.isRemote,
          district: o.district,
          compensationMin: o.compensationMin,
          compensationMax: o.compensationMax,
          isDemo: o.isDemo,
          category: { name: o.category.name, slug: o.category.slug },
          match: o.match,
        }));
    }

    // Recommended skills: skills required by high-match opps that the user lacks
    const userSkills = new Set(
      (
        await prisma.userSkill.findMany({
          where: { userId },
          include: { skill: true },
        })
      ).map((us) => us.skill.name.toLowerCase()),
    );
    const freeForm = new Set(
      ((profile?.skills as string[]) || []).map((s) => s.toLowerCase()),
    );
    const recommended = new Map<
      string,
      { name: string; count: number; trainings: string[] }
    >();
    for (const o of pool.slice(0, 60)) {
      for (const os of o.skills) {
        const key = os.skill.name.toLowerCase();
        if (userSkills.has(key) || freeForm.has(key)) continue;
        const rec = recommended.get(key) || {
          name: os.skill.name,
          count: 0,
          trainings: [],
        };
        rec.count++;
        recommended.set(key, rec);
      }
    }
    const trainings = await prisma.trainingProgram.findMany({
      where: {
        skills: {
          some: {
            skill: { name: { in: [...recommended.keys()].slice(0, 20) } },
          },
        },
      },
      take: 10,
      include: { skills: { include: { skill: true } } },
    });
    for (const t of trainings) {
      for (const ts of t.skills) {
        const rec = recommended.get(ts.skill.name.toLowerCase());
        if (rec && rec.trainings.length < 2) rec.trainings.push(t.title);
      }
    }
    const recommendedSkills = [...recommended.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const completion = profile ? computeCompletion(profile) : 0;

    res.json({
      profile: profile ? { ...profile, completion } : null,
      applications,
      saved,
      recentlyViewed,
      enrollments,
      matches,
      recommendedSkills,
      stats: {
        skillCount,
        openMatches: pool.length,
        savedCount: saved.length,
        applicationCount: applications.length,
      },
    });
  } catch (e) {
    next(e);
  }
});

/* ---------------- Applications ---------------- */

const applySchema = z.object({
  coverNote: z.string().max(1500).optional(),
  contactPhone: z.string().max(15).optional(),
  external: z.boolean().default(false),
});

router.post(
  "/applications",
  requireRole("YOUTH"),
  authLimiter,
  async (req, res, next) => {
    try {
      const body = parseOr400(applySchema, req.body);
      const { opportunityId, ...rest } = req.body as { opportunityId?: string };
      if (!opportunityId) throw badRequest("opportunityId is required");
      const opp = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
      });
      if (!opp || opp.status !== "ACTIVE")
        throw notFound("Opportunity not found or closed");
      if (opp.deadline && opp.deadline < new Date())
        throw badRequest(
          "The application deadline for this opportunity has passed",
        );

      const existing = await prisma.application.findUnique({
        where: {
          opportunityId_userId: { opportunityId, userId: req.auth!.id },
        },
      });
      if (existing && existing.status !== "WITHDRAWN")
        throw badRequest("You have already applied to this opportunity");

      const app = existing
        ? await prisma.application.update({
            where: { id: existing.id },
            data: { status: "SUBMITTED", ...rest, updatedAt: new Date() },
          })
        : await prisma.application.create({
            data: {
              opportunityId,
              userId: req.auth!.id,
              status: "SUBMITTED",
              ...rest,
            },
          });

      if (opp.organizationId) {
        const org = await prisma.organization.findUnique({
          where: { id: opp.organizationId },
        });
        if (org) {
          await prisma.notification.create({
            data: {
              userId: org.ownerId,
              title: "New application received",
              body: `A youth applied for "${opp.title}"`,
              link: "/employer",
            },
          });
        }
      }
      res
        .status(201)
        .json({
          application: app,
          confirmed: true,
          message: "Application submitted successfully",
        });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/applications", requireRole("YOUTH"), async (req, res, next) => {
  try {
    const apps = await prisma.application.findMany({
      where: { userId: req.auth!.id },
      include: { opportunity: { include: { category: true } } },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ applications: apps });
  } catch (e) {
    next(e);
  }
});

router.delete(
  "/applications/:id",
  requireRole("YOUTH"),
  async (req, res, next) => {
    try {
      const app = await prisma.application.findUnique({
        where: { id: req.params.id },
      });
      if (!app || app.userId !== req.auth!.id)
        throw notFound("Application not found");
      if (!["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"].includes(app.status)) {
        throw badRequest("This application can no longer be withdrawn");
      }
      const updated = await prisma.application.update({
        where: { id: app.id },
        data: { status: "WITHDRAWN" },
      });
      res.json({ application: updated });
    } catch (e) {
      next(e);
    }
  },
);

/* ---------------- Saved ---------------- */

router.get("/saved", requireRole("YOUTH"), async (req, res, next) => {
  try {
    const saved = await prisma.savedOpportunity.findMany({
      where: { userId: req.auth!.id },
      include: {
        opportunity: {
          include: { category: true, skills: { include: { skill: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ saved });
  } catch (e) {
    next(e);
  }
});

/* ---------------- Skill gap ---------------- */

router.get("/skill-gap", requireRole("YOUTH"), async (req, res, next) => {
  try {
    const profile = await prisma.youthProfile.findUnique({
      where: { userId: req.auth!.id },
    });
    const userSkillRows = await prisma.userSkill.findMany({
      where: { userId: req.auth!.id },
      include: { skill: true },
    });
    const have = new Set<string>([
      ...userSkillRows.map((r) => r.skill.name.toLowerCase()),
      ...((profile?.skills as string[]) || []).map((s) => s.toLowerCase()),
    ]);
    const gaps = await prisma.opportunitySkill.findMany({
      where: {
        required: true,
        opportunity: { status: "ACTIVE" },
        skill: { name: { notIn: [...have] } },
      },
      include: { skill: true },
      take: 40,
    });
    const counts = new Map<
      string,
      {
        name: string;
        count: number;
        trainings: { slug: string; title: string }[];
      }
    >();
    for (const g of gaps) {
      const key = g.skill.name;
      const rec = counts.get(key) || { name: key, count: 0, trainings: [] };
      rec.count++;
      counts.set(key, rec);
    }
    const top = [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    for (const t of top) {
      const progs = await prisma.trainingProgram.findMany({
        where: { skills: { some: { skill: { name: t.name } } } },
        select: { slug: true, title: true },
        take: 2,
      });
      t.trainings = progs;
    }
    res.json({ mySkills: userSkillRows.map((r) => r.skill.name), gaps: top });
  } catch (e) {
    next(e);
  }
});
