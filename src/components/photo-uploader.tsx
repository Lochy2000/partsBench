"use client";

import { useRef, useState, useTransition } from "react";
import type { PhotoType } from "@prisma/client";
import { Loader2, Upload } from "lucide-react";
import { confirmPhotoUpload, requestPhotoUpload } from "@/actions/photos";
import { Button } from "@/components/ui/button";

// Soft client-side sanity check, not a server-enforced limit — a presigned PUT URL doesn't
// support size conditions the way a presigned POST policy would, and that complexity isn't
// worth it for a single-user internal tool.
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export function PhotoUploader({
  itemId,
  photoType,
  label,
}: {
  itemId: string;
  photoType: PhotoType;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setError("Photo is too large (max 15MB).");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const { uploadUrl, storageKey } = await requestPhotoUpload({
          itemId,
          photoType,
          contentType: file.type,
          filename: file.name,
        });

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload failed");
        }

        await confirmPhotoUpload({ itemId, photoType, storageKey });
      } catch {
        setError("Upload failed — try again.");
      }
    });
  }

  return (
    <div className="space-y-1.5">
      {/* No `capture` attribute — that forces mobile browsers straight into the camera app,
          skipping the native picker's camera/gallery/files choice. Omitting it lets the
          browser show its normal picker with both options. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Upload />}
        {label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
