"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { confirmPhotoUpload, requestPhotoUpload } from "@/actions/photos";
import { Button } from "@/components/ui/button";

// Same soft sanity check as PhotoUploader — see that component for why this isn't
// server-enforced.
const MAX_FILE_BYTES = 15 * 1024 * 1024;

async function uploadOne(itemId: string, file: File): Promise<void> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} is too large (max 15MB).`);
  }

  const contentType = file.type || "application/octet-stream";

  const { uploadUrl, storageKey } = await requestPhotoUpload({
    itemId,
    photoType: "UNSORTED",
    contentType,
    filename: file.name,
  });

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed with status ${uploadResponse.status}`);
  }

  await confirmPhotoUpload({ itemId, photoType: "UNSORTED", storageKey });
}

export function QuickCaptureUploader({ itemId }: { itemId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setError(null);

    startTransition(async () => {
      const results = await Promise.allSettled(files.map((file) => uploadOne(itemId, file)));
      const failedCount = results.filter((r) => r.status === "rejected").length;

      if (failedCount > 0) {
        // Next.js redacts thrown Server Action error messages in production — this is the
        // real cause in local dev, cheap insurance for whenever this gets debugged again.
        console.error(
          "Quick capture upload failures:",
          results.filter((r) => r.status === "rejected"),
        );
        setError(
          failedCount === files.length
            ? "Upload failed — try again."
            : `Uploaded ${files.length - failedCount} of ${files.length} — ${failedCount} failed, try again.`,
        );
      }
    });
  }

  return (
    <div className="space-y-1.5">
      {/* No `capture` attribute — same reasoning as PhotoUploader, avoids the mobile
          camera-takeover / iOS Safari JS-context-loss issue. `multiple` lets the picker's
          camera flow snap several photos in one session on browsers that support it. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Camera />}
        Quick capture
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
