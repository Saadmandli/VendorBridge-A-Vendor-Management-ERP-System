/**
 * Zero-setup local launcher.
 * Boots an embedded PostgreSQL (no Docker / no install needed), applies the
 * schema, seeds demo data on first run, then starts the Next.js dev server.
 * Just `npm run dev:local` and open http://localhost:3000.
 */
import EmbeddedPostgres from "embedded-postgres";
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, ".localdb");
const PG_PORT = 5433;
const DB_URL = `postgresql://vendorbridge:vendorbridge@localhost:${PG_PORT}/vendorbridge?schema=public`;
const JWT = process.env.JWT_SECRET || "local-dev-secret-local-dev-secret-1234567890";
const env = { ...process.env, DATABASE_URL: DB_URL, JWT_SECRET: JWT };

const pg = new EmbeddedPostgres({ databaseDir: dataDir, user: "vendorbridge", password: "vendorbridge", port: PG_PORT, persistent: true });

let server;
async function shutdown() {
  console.log("\nShutting down…");
  try { server?.kill(); } catch {}
  try { await pg.stop(); } catch {}
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/** Clean up a database left running/locked by a previous session. */
function cleanupStaleDatabase() {
  const pidFile = path.join(dataDir, "postmaster.pid");
  if (!fs.existsSync(pidFile)) return;
  try {
    const pid = parseInt(String(fs.readFileSync(pidFile, "utf8")).split("\n")[0].trim(), 10);
    if (pid && pid > 0) {
      console.log(`• Found a database from a previous run (pid ${pid}) — stopping it…`);
      try {
        if (process.platform === "win32") execSync(`taskkill /F /PID ${pid} /T`, { stdio: "ignore" });
        else process.kill(pid, "SIGKILL");
      } catch { /* already gone */ }
    }
  } catch { /* ignore */ }
  try { fs.rmSync(pidFile, { force: true }); } catch {}
}

async function startPostgresWithRetry() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await pg.start();
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      console.log(`• Database busy (attempt ${attempt}/3). Cleaning up and retrying…`);
      cleanupStaleDatabase();
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
}

(async () => {
  const firstRun = !fs.existsSync(path.join(dataDir, "PG_VERSION"));
  if (firstRun) {
    console.log("• First run: initializing local database (one-time)…");
    await pg.initialise();
  } else {
    cleanupStaleDatabase(); // proactively clear any leftover lock
  }

  console.log("• Starting local PostgreSQL…");
  await startPostgresWithRetry();
  try { await pg.createDatabase("vendorbridge"); } catch {}

  // Guarantee the Next.js app connects to THIS embedded database.
  fs.writeFileSync(path.join(root, ".env.local"), `DATABASE_URL=${DB_URL}\nJWT_SECRET=${JWT}\n`);

  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  console.log("• Applying database schema…");
  execSync(`${npxCmd} prisma db push --skip-generate --accept-data-loss`, { cwd: root, env, stdio: "inherit", shell: true });

  const { PrismaClient } = await import("@prisma/client");
  process.env.DATABASE_URL = DB_URL;
  const prisma = new PrismaClient();
  const userCount = await prisma.user.count().catch(() => 0);
  await prisma.$disconnect();
  if (userCount === 0) {
    console.log("• Seeding demo data…");
    execSync(`${npxCmd} tsx prisma/seed.ts`, { cwd: root, env, stdio: "inherit", shell: true });
  } else {
    console.log(`• Database already has ${userCount} users — skipping seed.`);
  }

  console.log("\n✓ Database ready. Starting the app on http://localhost:3000 …\n");
  server = spawn("npm run dev", { cwd: root, env, stdio: "inherit", shell: true });
  server.on("exit", (code) => { pg.stop().finally(() => process.exit(code ?? 0)); });
})().catch(async (e) => {
  const msg = (e && (e.message || e.toString())) || "unknown error";
  console.error("\nFailed to start:", msg);
  console.error("\nIf it says the database is 'still in use', close ALL other command windows");
  console.error("(or restart your PC) and run  npm run dev:local  again.\n");
  try { await pg.stop(); } catch {}
  process.exit(1);
});
