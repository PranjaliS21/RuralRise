import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireRole } from "../auth";
import { parseOr400, notFound, badRequest } from "../errors";
import { uniqueSlug } from "../utils";

export const router = Router();

const opportunitySchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(20).max(5000),
  categorySlug: z.string().min(1),
  workType: z.enum([
    "LOCAL_JOB",
    "REMOTE_JOB",
    "PART_TIME",
    "APPRENTICESHIP",
    "INTERNSHIP",
    "FREELANCE",
    "GIG",
    "SELF_EMPLOYMENT",
    "SELL_PRODUCT_SERVICE",
  ]),
  isRemote: z.boolean().default(false),
  village: z.string().max(80).optional(),
  district: z.string().max(60).optional(),
  state: z.string().max(60).optional(),
  compensationMin: z.number().int().min(0).optional(),
  compensationMax: z.number().int().min(0).optional(),
  paymentBasis: z.string().max(30).optional(),
  eligibility: z.string().max(500).optional(),
  requiredEducation: z.string().max(80).optional(),
  timeCommitment: z.string().max(80).optional(),
  applicationInstructions: z.string().max(1000).optional(),
  skills: z.array(z.string().max(40)).max(10).default([]),
  deadline: z.string().datetime().optional(),
});

router.get(
  "/opportunities",
  requireRole("EMPLOYER"),
  async (req, res, next) => {
    try {
      const org = await prisma.organization.findUnique({
        where: { ownerId: req.auth!.id },
      });
      if (!org) throw notFound("Organization not found");
      const items = await prisma.opportunity.findMany({
        where: { organizationId: org.id },
        include: { category: true, _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
      });
      res.json({ items });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/opportunities",
  requireRole("EMPLOYER"),
  async (req, res, next) => {
    try {
      const data = parseOr400(opportunitySchema, req.body);
      const org = await prisma.organization.findUnique({
        where: { ownerId: req.auth!.id },
      });
      if (!org) throw notFound("Organization not found");

      const slug = await uniqueSlug(data.title, (s) =>
        prisma.opportunity.findUnique({ where: { slug: s } }).then((x) => !!x),
      );
      const category = await prisma.category.findUnique({
        where: { slug: data.categorySlug },
      });
      if (!category) throw badRequest("Unknown category");

      const opp = await prisma.opportunity.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          categoryId: category.id,
          organizationId: org.id,
          workType: data.workType,
          isRemote: data.isRemote,
          village: data.village,
          district: data.district ?? org.district,
          state: data.state ?? org.state,
          compensationMin: data.compensationMin,
          compensationMax: data.compensationMax,
          paymentBasis: data.paymentBasis,
          eligibility: data.eligibility,
          requiredEducation: data.requiredEducation,
          timeCommitment: data.timeCommitment,
          applicationInstructions: data.applicationInstructions,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
          skills: {
            create: await Promise.all(
              data.skills.map(async (name) => {
                const skill = await prisma.skill.upsert({
                  where: { name },
                  update: {},
                  create: {
                    name,
                    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  },
                });
                return { skillId: skill.id, required: true };
              }),
            ),
          },
        },
      });
      res.status(201).json({ opportunity: opp });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/opportunities/:id",
  requireRole("EMPLOYER"),
  async (req, res, next) => {
    try {
      const org = await prisma.organization.findUnique({
        where: { ownerId: req.auth!.id },
      });
      if (!org) throw notFound("Organization not found");
      const opp = await prisma.opportunity.findUnique({
        where: { id: req.params.id },
      });
      if (!opp || opp.organizationId !== org.id)
        throw notFound("Opportunity not found");

      const statusSchema = z.object({
        status: z.enum(["ACTIVE", "PAUSED", "EXPIRED"]),
      });
      const data = parseOr400(statusSchema, req.body);
      const updated = await prisma.opportunity.update({
        where: { id: opp.id },
        data,
      });
      res.json({ opportunity: updated });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/applications", requireRole("EMPLOYER"), async (req, res, next) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { ownerId: req.auth!.id },
    });
    if (!org) throw notFound("Organization not found");
    const apps = await prisma.application.findMany({
      where: { opportunity: { organizationId: org.id } },
      include: {
        opportunity: { select: { title: true, slug: true } },
        user: { select: { id: true, name: true, district: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    // Privacy: show minimal candidate info
    const items = apps.map((a) => ({
      id: a.id,
      status: a.status,
      coverNote: a.coverNote,
      contactPhone: a.contactPhone,
      createdAt: a.createdAt,
      opportunity: a.opportunity,
      candidate: {
        id: a.user.id,
        name: a.user.name,
        district: a.user.district,
        phone: a.contactPhone ?? null,
      },
    }));
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

const reviewSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum([
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
    "ACCEPTED",
    "REJECTED",
  ]),
  note: z.string().max(500).optional(),
});

router.post(
  "/applications/review",
  requireRole("EMPLOYER"),
  async (req, res, next) => {
    try {
      const data = parseOr400(reviewSchema, req.body);
      const app = await prisma.application.findUnique({
        where: { id: data.applicationId },
        include: { opportunity: true },
      });
      if (!app) throw notFound("Application not found");
      const org = await prisma.organization.findUnique({
        where: { ownerId: req.auth!.id },
      });
      if (!org || app.opportunity.organizationId !== org.id)
        throw notFound("Application not found");

      const updated = await prisma.application.update({
        where: { id: app.id },
        data: { status: data.status, employerNote: data.note },
      });
      await prisma.notification.create({
        data: {
          userId: app.userId,
          title: `Application ${data.status.toLowerCase().replace("_", " ")}`,
          body: `Your application for "${app.opportunity.title}" was updated to ${data.status}.`,
          link: "/dashboard",
        },
      });
      res.json({ application: updated });
    } catch (e) {
      next(e);
    }
  },
);
