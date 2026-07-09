// Next.js convention is .env.local for local secrets (see docs/standards/CONTRIBUTING.md),
// so load that explicitly — plain "dotenv/config" would only pick up ".env".
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// quiet: true suppresses dotenv's stdout "tips" (self-promo, unrelated to loading env vars).
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
