/** Responsibility: configure and export the PostgreSQL connection pool. */
import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({ connectionString: env.DATABASE_URL });
pool.on("error", (error) => console.error("Unexpected PostgreSQL pool error", error));
