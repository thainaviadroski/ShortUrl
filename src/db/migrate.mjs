// Applies the SQL migrations in ./drizzle at container start-up.
// Plain JS on purpose: the production image has neither tsx nor drizzle-kit.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set; cannot run migrations.");
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });

try {
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Database migrations applied.");
} finally {
  await client.end();
}
