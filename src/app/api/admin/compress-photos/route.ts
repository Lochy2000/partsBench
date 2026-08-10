import type { NextRequest } from "next/server";
import { compressBackfillBatch } from "@/lib/photo-backfill";

// aws-sdk and sharp need Node APIs, not the Edge runtime.
export const runtime = "nodejs";

// One-off backfill endpoint — see scripts/compress-existing-photos.ts for why this exists as a
// route at all: "Sensitive" Vercel env vars (DATABASE_URL, R2 credentials) can't be pulled down
// locally, so this runs the same logic inside the deployed app instead, where those vars are
// already resolved. No extra auth here — every route already sits behind the login check in
// src/proxy.ts, including this one. Delete this route once the backfill is done; it isn't
// meant to stick around.
//
// GET /api/admin/compress-photos                         -> dry run, first 25
// GET /api/admin/compress-photos?limit=25&cursor=<id>     -> dry run, next batch
// GET /api/admin/compress-photos?dryRun=false              -> actually rewrite objects
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const dryRun = params.get("dryRun") !== "false";
  const limit = Math.min(Number(params.get("limit") ?? 25) || 25, MAX_LIMIT);
  const cursor = params.get("cursor");

  const result = await compressBackfillBatch({ dryRun, limit, cursor });

  const nextUrl = result.done
    ? null
    : `${request.nextUrl.pathname}?dryRun=${dryRun}&limit=${limit}&cursor=${result.nextCursor}`;

  return Response.json({ dryRun, ...result, nextUrl });
}
