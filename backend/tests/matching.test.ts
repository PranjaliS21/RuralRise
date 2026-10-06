import { describe, it, expect } from "vitest";
import { score } from "../src/matching/engine";

const baseProfile = {
  district: "Warangal",
  village: "Khanapur",
  preferredRadiusKm: 25,
  interests: ["handicrafts"],
  skills: ["Tailoring", "Basic English"],
  education: "12th",
  availability: "Full time",
  languages: ["Telugu"],
};

const baseOpp = {
  workType: "LOCAL_JOB",
  isRemote: false,
  district: "Warangal",
  village: "Khanapur",
  requiredEducation: "10th",
  timeCommitment: "Full time",
  deadline: null,
  skills: [
    { skill: { name: "Tailoring" }, required: true },
    { skill: { name: "Embroidery" }, required: true },
  ],
};

describe("matching engine", () => {
  it("scores a strong match high and gives reasons", () => {
    const r = score(baseProfile, baseOpp, "Handicrafts & Textiles");
    expect(r.score).toBeGreaterThanOrEqual(60);
    expect(r.reasons.some((x) => x.type === "positive")).toBe(true);
  });

  it("scores a weak match low", () => {
    const r = score(
      { ...baseProfile, skills: ["Bookkeeping"], interests: ["digital"] },
      { ...baseOpp, district: "Nashik", village: undefined },
      "Digital & Remote",
    );
    expect(r.score).toBeLessThan(50);
  });

  it("never returns 0 or 100", () => {
    const high = score(baseProfile, baseOpp, "Handicrafts & Textiles");
    const low = score({}, { ...baseOpp, skills: [] }, null);
    expect(high.score).toBeLessThan(100);
    expect(low.score).toBeGreaterThan(0);
  });

  it("handles empty profile without crashing", () => {
    const r = score({}, baseOpp, null);
    expect(r.score).toBeGreaterThan(0);
    expect(
      r.reasons.some((x) => x.text.includes("Complete your profile")),
    ).toBe(true);
  });

  it("gives remote bonus for remote jobs", () => {
    const r = score(baseProfile, { ...baseOpp, isRemote: true }, null);
    expect(r.reasons.some((x) => x.text.includes("Remote"))).toBe(true);
  });

  it("flags missing required skill as improvement", () => {
    const r = score({ ...baseProfile, skills: [] }, baseOpp, null);
    expect(r.reasons.some((x) => x.type === "improve")).toBe(true);
  });
});
