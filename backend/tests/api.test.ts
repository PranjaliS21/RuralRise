import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/db";

/**
 * API smoke tests. These run against a live database (see README for setup).
 * They create and clean up their own test data.
 */
const testEmail = "api-test-user@ruralrise.test";

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("auth flow", () => {
  it("registers a new youth user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: testEmail,
        password: "Password123!",
        name: "Test User",
        role: "YOUTH",
        district: "Warangal",
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.headers["set-cookie"]).toBeTruthy();
  });

  it("rejects duplicate registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: testEmail, password: "Password123!", name: "Test User" });
    expect(res.status).toBe(400);
  });

  it("logs in and rejects bad password", async () => {
    const ok = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: "Password123!" });
    expect(ok.status).toBe(200);
    const bad = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: "wrongpass" });
    expect(bad.status).toBe(401);
  });
});

describe("opportunities API", () => {
  it("lists opportunities", async () => {
    const res = await request(app).get("/api/opportunities");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("filters by search query", async () => {
    const res = await request(app).get("/api/opportunities?q=tailor");
    expect(res.status).toBe(200);
    expect(
      res.body.items.some((i: { title: string }) => /tailor/i.test(i.title)),
    ).toBe(true);
  });

  it("shows a single opportunity by slug", async () => {
    const list = await request(app).get("/api/opportunities");
    const slug = list.body.items[0].slug;
    const res = await request(app).get(`/api/opportunities/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.opportunity.slug).toBe(slug);
  });

  it("404s for unknown slug", async () => {
    const res = await request(app).get(
      "/api/opportunities/no-such-thing-exists",
    );
    expect(res.status).toBe(404);
  });
});

describe("scheme and training directories", () => {
  it("lists schemes", async () => {
    const res = await request(app).get("/api/schemes");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("lists training programs", async () => {
    const res = await request(app).get("/api/training");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});

describe("authorization", () => {
  it("blocks admin routes without auth", async () => {
    const res = await request(app).get("/api/admin/overview");
    expect(res.status).toBe(401);
  });

  it("blocks youth routes without auth", async () => {
    const res = await request(app).get("/api/youth/dashboard");
    expect(res.status).toBe(401);
  });

  it("blocks employer routes for youth role", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: "Password123!" });
    const cookie = login.headers["set-cookie"];
    const res = await request(app)
      .get("/api/employer/opportunities")
      .set("Cookie", cookie);
    expect(res.status).toBe(403);
  });
});
