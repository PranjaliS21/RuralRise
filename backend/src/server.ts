import "dotenv/config";
import app from "./app";
import { prisma } from "./db";

const PORT = Number(process.env.PORT || 4000);

const server = app.listen(PORT, () => {
  console.log(`[RuralRise] API listening on http://localhost:${PORT}`);
});

async function shutdown() {
  console.log("\n[RuralRise] Shutting down...");
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
