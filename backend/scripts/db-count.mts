/**
 * Quick DB sanity check: prints row counts for the main tables.
 * Run with: npm run db:count            (JSON output)
 *          npm run db:count -- --pretty (aligned table output)
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const pretty = process.argv.includes("--pretty");

try {
  const [
    users, youthProfiles, organizations, categories, opportunities, skills,
    applications, savedOpportunities, opportunityViews, trainingPrograms,
    trainingEnrollments, schemes, businessIdeas, businessPlans,
    marketplaceListings, notifications,
  ] = await Promise.all([
    p.user.count(),
    p.youthProfile.count(),
    p.organization.count(),
    p.category.count(),
    p.opportunity.count(),
    p.skill.count(),
    p.application.count(),
    p.savedOpportunity.count(),
    p.opportunityView.count(),
    p.trainingProgram.count(),
    p.trainingEnrollment.count(),
    p.scheme.count(),
    p.businessIdea.count(),
    p.businessPlan.count(),
    p.marketplaceListing.count(),
    p.notification.count(),
  ]);

  const counts = {
    users, youthProfiles, organizations, categories, opportunities, skills,
    applications, savedOpportunities, opportunityViews, trainingPrograms,
    trainingEnrollments, schemes, businessIdeas, businessPlans,
    marketplaceListings, notifications,
  };

  if (pretty) {
    const width = Math.max(...Object.keys(counts).map((k) => k.length));
    for (const [table, count] of Object.entries(counts)) {
      console.log(`${table.padEnd(width)}  ${String(count).padStart(6)}`);
    }
  } else {
    console.log(JSON.stringify(counts));
  }
  const empty = Object.values(counts).every((n) => n === 0);
  if (empty) {
    console.warn("[db-count] All tables are empty — did you run `npm run db:seed`?");
  }
} catch (err) {
  console.error("[db-count] Could not reach the database:",
    err instanceof Error ? err.message : err);
  console.error("[db-count] Start it with: npm run db:embedded");
  process.exitCode = 1;
} finally {
  await p.$disconnect();
}
