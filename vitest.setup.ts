import { config } from "dotenv";

// quiet: true suppresses dotenv's stdout "tips" (self-promo, unrelated to loading env vars).
config({ path: ".env.test", quiet: true });
