/** Responsibility: start the HTTP listener and handle graceful process shutdown. */
import { app } from "./app";
import { env } from "./config/env";
import { pool } from "./config/database";
const server = app.listen(env.PORT, () => console.info(`InternMatch API listening on port ${env.PORT}`));
async function shutdown(signal: string): Promise<void> {
  console.info(`${signal} received; shutting down`);
  server.close(async () => { await pool.end(); process.exit(0); });
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
