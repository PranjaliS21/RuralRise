/**
 * Starts an embedded PostgreSQL instance for local development (no install
 * needed). Stores data under backend/.embedded-db. Stop with Ctrl+C.
 */
import EmbeddedPostgresMod from "embedded-postgres";
const EmbeddedPostgres = EmbeddedPostgresMod.default ?? EmbeddedPostgresMod;
import fs from "node:fs";

const DATA_DIR = new URL("../.embedded-db", import.meta.url).pathname.replace(
  /^\/([A-Za-z]):/,
  "$1:",
);

const FRESH = !fs.existsSync(DATA_DIR) || fs.readdirSync(DATA_DIR).length === 0;
if (!FRESH) {
  console.log("[embedded-db] reusing existing data dir…");
} else {
  console.log("[embedded-db] initialising fresh data dir…");
}

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
});

if (FRESH) await pg.initialise();
await pg.start();
if (FRESH) await pg.createDatabase("ruralrise");

console.log(
  "[embedded-db] PostgreSQL running on postgresql://postgres:postgres@localhost:5432/ruralrise",
);
console.log(
  "[embedded-db] Now run: npm run db:migrate && npm run db:seed  (in another terminal)",
);

process.on("SIGINT", async () => {
  console.log("\n[embedded-db] stopping…");
  await pg.stop();
  process.exit(0);
});
