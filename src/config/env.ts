/** Responsibility: validate and expose required process environment settings at startup. */
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`);
}
export const env = parsed.data;
