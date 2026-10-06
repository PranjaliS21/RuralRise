/**
 * RuralRise explainable rule-based matching engine (v1).
 *
 * Scores an opportunity against a youth profile, returning a 0-100 match
 * percentage plus human-readable reasons. Modular by design: each rule is a
 * pure function over (profile, opportunity, skills) so a future ML model can
 * replace `score()` without touching callers.
 *
 * NOTE: a match score expresses profile fit only. It is NOT a guarantee of
 * selection, interview, or earnings.
 */

export interface MatchProfile {
  district?: string | null;
  village?: string | null;
  preferredRadiusKm?: number | null;
  interests?: string[];
  skills?: string[]; // skill names
  education?: string | null;
  availability?: string | null;
  languages?: string[];
}

export interface MatchOpportunity {
  workType: string;
  isRemote: boolean;
  district?: string | null;
  village?: string | null;
  requiredEducation?: string | null;
  timeCommitment?: string | null;
  deadline?: Date | string | null;
  skills: { skill: { name: string }; required: boolean }[];
}

export interface MatchResult {
  score: number; // 0-100
  reasons: MatchReason[];
}

export interface MatchReason {
  type: "positive" | "improve";
  text: string;
}

const norm = (s?: string | null) => (s || "").toLowerCase().trim();
const overlaps = (a: string[], b: string[]) => {
  const setB = new Set(b.map(norm).filter(Boolean));
  return a.some((x) => setB.has(norm(x)));
};

const WEIGHTS = {
  skills: 0.4,
  location: 0.25,
  interests: 0.15,
  eligibility: 0.1,
  availability: 0.05,
  workType: 0.05,
} as const;

function skillRule(profile: MatchProfile, opp: MatchOpportunity) {
  const userSkills = new Set((profile.skills || []).map(norm).filter(Boolean));
  const req = opp.skills.filter((s) => s.required).map((s) => s.skill.name);
  const nice = opp.skills.filter((s) => !s.required).map((s) => s.skill.name);
  if (req.length === 0 && nice.length === 0)
    return { ratio: 0.6, matched: [], missing: [], reasons: [] as string[] };

  const matched = [...req, ...nice].filter((s) => userSkills.has(norm(s)));
  const missing = req.filter((s) => !userSkills.has(norm(s)));
  const ratio =
    req.length + nice.length > 0
      ? matched.length / (req.length + nice.length)
      : 0;
  const reasons: string[] = [];
  if (matched.length)
    reasons.push(
      `Matches your ${matched.slice(0, 2).join(" and ")} skill${matched.length > 1 ? "s" : ""}`,
    );
  if (missing.length)
    reasons.push(`One recommended skill to improve your fit: ${missing[0]}`);
  return { ratio, matched, missing, reasons };
}

function locationRule(profile: MatchProfile, opp: MatchOpportunity) {
  if (opp.isRemote)
    return { ratio: 1, reasons: ["Remote — work from your village"] };
  const userDistrict = norm(profile.district);
  const oppDistrict = norm(opp.district);
  if (!userDistrict) return { ratio: 0.5, reasons: [] };
  if (oppDistrict && oppDistrict === userDistrict)
    return { ratio: 1, reasons: [`Within your district (${opp.district})`] };
  if (opp.village && norm(profile.village) === norm(opp.village))
    return { ratio: 1, reasons: ["In your village"] };
  const radius = profile.preferredRadiusKm ?? 25;
  if (radius >= 50)
    return { ratio: 0.8, reasons: ["Within your preferred distance"] };
  return { ratio: 0.55, reasons: ["Nearby district — check travel distance"] };
}

function interestRule(
  profile: MatchProfile,
  opp: MatchOpportunity,
  categorySlug?: string | null,
) {
  const interests = (profile.interests || []).map(norm).filter(Boolean);
  if (!interests.length) return { ratio: 0.5, reasons: [] };
  const hay = norm(categorySlug) + " " + norm(opp.workType);
  if (interests.some((i) => hay.includes(i) || i.includes(hay)))
    return { ratio: 1, reasons: ["Fits your stated interests"] };
  return { ratio: 0.35, reasons: [] };
}

function eligibilityRule(profile: MatchProfile, opp: MatchOpportunity) {
  const req = norm(opp.requiredEducation);
  const edu = norm(profile.education);
  if (!req) return { ratio: 1, reasons: [] };
  if (!edu)
    return {
      ratio: 0.5,
      reasons: ["Add your education to confirm eligibility"],
    };
  const ladder = [
    "none",
    "8th",
    "10th",
    "12th",
    "diploma",
    "iti",
    "graduate",
    "postgraduate",
  ];
  const li = ladder.findIndex((l) => edu.includes(l));
  const ri = ladder.findIndex((l) => req.includes(l));
  if (ri === -1 || li === -1) return { ratio: 0.6, reasons: [] };
  if (li >= ri)
    return { ratio: 1, reasons: ["You meet the education requirement"] };
  return { ratio: 0, reasons: ["Education below stated requirement"] };
}

function availabilityRule(profile: MatchProfile, opp: MatchOpportunity) {
  const av = norm(profile.availability);
  const tc = norm(opp.timeCommitment);
  if (!av || !tc) return { ratio: 0.6, reasons: [] };
  const fullTime = tc.includes("full");
  const wantsFull = av.includes("full");
  if (fullTime === wantsFull)
    return { ratio: 1, reasons: ["Fits your availability"] };
  if (tc.includes("flexible") || av.includes("flexible"))
    return { ratio: 0.9, reasons: ["Flexible timing"] };
  return { ratio: 0.3, reasons: [] };
}

function workTypeRule(profile: MatchProfile, opp: MatchOpportunity) {
  // Interests may name a work type ("remote", "freelance")
  const interests = (profile.interests || []).map(norm);
  const wt = norm(opp.workType);
  if (!interests.length) return { ratio: 0.6, reasons: [] };
  if (
    interests.some(
      (i) => wt.includes(i) || (i.includes("remote") && opp.isRemote),
    )
  ) {
    return { ratio: 1, reasons: ["Preferred work type"] };
  }
  return { ratio: 0.5, reasons: [] };
}

export function score(
  profile: MatchProfile,
  opp: MatchOpportunity,
  categorySlug?: string | null,
): MatchResult {
  const reasons: MatchReason[] = [];
  let total = 0;
  let weightSum = 0;

  const add = (w: number, ratio: number, rs: string[]) => {
    total += ratio * w;
    weightSum += w;
    for (const r of rs) reasons.push({ type: "positive", text: r });
  };

  const sk = skillRule(profile, opp);
  add(WEIGHTS.skills, sk.ratio, sk.reasons);
  const loc = locationRule(profile, opp);
  add(WEIGHTS.location, loc.ratio, loc.reasons);
  const intr = interestRule(profile, opp, categorySlug);
  add(WEIGHTS.interests, intr.ratio, intr.reasons);
  const eli = eligibilityRule(profile, opp);
  add(WEIGHTS.eligibility, eli.ratio, eli.reasons);
  const ava = availabilityRule(profile, opp);
  add(WEIGHTS.availability, ava.ratio, ava.reasons);
  const wt = workTypeRule(profile, opp);
  add(WEIGHTS.workType, wt.ratio, wt.reasons);

  let pct = weightSum > 0 ? (total / weightSum) * 100 : 0;

  // Missing-profile safety: if the profile is nearly empty, compress toward
  // the middle so we never show a misleading 0% or 100%.
  const filled =
    (profile.skills?.length ? 1 : 0) +
    (profile.district ? 1 : 0) +
    (profile.interests?.length ? 1 : 0) +
    (profile.education ? 1 : 0) +
    (profile.availability ? 1 : 0);
  if (filled < 2) pct = pct * 0.7 + 25;

  if (sk.missing.length && pct >= 40) {
    reasons.push({
      type: "improve",
      text: `One recommended skill to improve your fit: ${sk.missing[0]}`,
    });
  }
  if (filled < 2)
    reasons.push({
      type: "improve",
      text: "Complete your profile for better matches",
    });

  const score = Math.max(5, Math.min(99, Math.round(pct)));
  return { score, reasons };
}
