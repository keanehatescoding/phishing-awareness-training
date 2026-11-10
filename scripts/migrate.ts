import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/migrator";
import { Pool } from "pg";
import path from "path";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const db = drizzle({ client: pool });

  const migrationsFolder = path.resolve(process.cwd(), "./drizzle");
  console.log("Running migrations from:", migrationsFolder);
  await migrate(db, { migrationsFolder });
  console.log("Migrations complete!");

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
