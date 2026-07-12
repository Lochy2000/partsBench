"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import type { PhotoType } from "@prisma/client";
import { deletePhoto } from "@/actions/photos";

export interface GalleryPhoto {
  id: string;
  type: PhotoType;
  url: string;
}

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  BEFORE: "Before",
  AFTER: "After",
  TEST: "Test",
  LISTING: "Listing",
};

const PHOTO_TYPE_ORDER: PhotoType[] = ["BEFORE", "AFTER", "TEST", "LISTING"];

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(photoId: string) {
    startTransition(async () => {
      await deletePhoto(photoId);
    });
  }

  if (photos.length === 0) return null;

  const grouped = PHOTO_TYPE_ORDER.map((type) => ({
    type,
    items: photos.filter((photo) => photo.type === type),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <div key={group.type} className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {PHOTO_TYPE_LABELS[group.type]}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {group.items.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived
                    R2 URLs; next/image's optimizer/caching isn't a fit for expiring auth tokens */}
                <img src={photo.url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Delete photo"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
