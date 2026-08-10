// One-off backfill: photo-uploader.tsx / quick-capture-uploader.tsx now compress images in the
// browser before upload, but that only affects photos uploaded from here on. This re-encodes
// every ItemPhoto already sitting in R2 using the same rules (see src/lib/image-compression.ts
// and the shared src/lib/photo-backfill.ts), overwriting each object in place.
//
// Run with: npm run photos:compress -- --dry-run   (report only, writes nothing)
//           npm run photos:compress                (actually rewrite objects)
//
// Defaults to .env.local (Docker Postgres/MinIO). To run against production instead, note that
// "Sensitive" Vercel env vars can't be read back locally at all (not via `vercel env pull`, not
// via the dashboard) — in that case use src/app/api/admin/compress-photos/route.ts instead,
// which runs on Vercel where those vars are already resolved for the live app.
import { config } from "dotenv";

const dryRun = process.argv.includes("--dry-run");
const envFileArg = process.argv.find((arg) => arg.startsWith("--env-file="));
const envFile = envFileArg
  ? envFileArg.slice("--env-file=".length)
  : ".env.local";
const BATCH_SIZE = 25;

async function main() {
  // Same reasoning as prisma.config.ts: Next's convention is .env.local, and this script runs
  // standalone (not through Next or `prisma db seed`), so nothing else loads it. This has to
  // run — and finish — before src/lib/photo-backfill (which pulls in prisma and r2) is
  // imported, since both read process.env at module-load time; a static import would be
  // hoisted above this call, so it's loaded dynamically here instead, only after config()
  // resolves.
  console.log(`Loading env from ${envFile}`);
  config({ path: envFile, quiet: true });

  const { compressBackfillBatch } = await import("../src/lib/photo-backfill");
  const { prisma } = await import("../src/lib/prisma");

  console.log(dryRun ? "Dry run — nothing will be written.\n" : "Live run.\n");

  let cursor: string | null = null;
  let totalRewritten = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalBytesBefore = 0;
  let totalBytesAfter = 0;

  for (;;) {
    const batch = await compressBackfillBatch({
      dryRun,
      limit: BATCH_SIZE,
      cursor,
    });
    for (const line of batch.log) console.log(line);

    totalRewritten += batch.rewritten;
    totalSkipped += batch.skipped;
    totalFailed += batch.failed;
    totalBytesBefore += batch.bytesBefore;
    totalBytesAfter += batch.bytesAfter;

    if (batch.done) break;
    cursor = batch.nextCursor;
  }

  console.log(
    `\nDone. ${totalRewritten} rewritten, ${totalSkipped} skipped (already small or unsupported format), ${totalFailed} failed.`,
  );
  if (totalRewritten > 0) {
    const mbBefore = (totalBytesBefore / 1024 / 1024).toFixed(1);
    const mbAfter = (totalBytesAfter / 1024 / 1024).toFixed(1);
    console.log(`${mbBefore}MB -> ${mbAfter}MB across rewritten photos.`);
  }
  if (dryRun) {
    console.log(
      "Dry run — nothing was written. Re-run without --dry-run to apply.",
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
