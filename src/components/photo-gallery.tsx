"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import type { PhotoType } from "@prisma/client";
import { deletePhoto, reassignPhotoType } from "@/actions/photos";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface GalleryPhoto {
  id: string;
  type: PhotoType;
  url: string;
}

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  UNSORTED: "Unsorted",
  BEFORE: "Before",
  AFTER: "After",
  TEST: "Test",
  LISTING: "Listing",
};

// Unsorted first — it's the most actionable group (quick-captured photos waiting to be
// categorized). Not offered as a reassignment target below; a photo only ever starts there.
const PHOTO_TYPE_ORDER: PhotoType[] = ["UNSORTED", "BEFORE", "AFTER", "TEST", "LISTING"];
const REASSIGN_TARGETS: PhotoType[] = ["BEFORE", "AFTER", "TEST", "LISTING"];

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(photoId: string) {
    startTransition(async () => {
      await deletePhoto(photoId);
    });
  }

  function handleReassign(photoId: string, newType: PhotoType) {
    startTransition(async () => {
      await reassignPhotoType(photoId, newType);
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
            {group.type === "UNSORTED" && ` (${group.items.length})`}
          </p>
          {group.type === "UNSORTED" && (
            <p className="text-xs text-muted-foreground">Assign these to a category.</p>
          )}
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
                <div className="absolute inset-x-1 bottom-1">
                  <Select
                    value={photo.type === "UNSORTED" ? "" : photo.type}
                    onValueChange={(value) => handleReassign(photo.id, value as PhotoType)}
                    disabled={isPending}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-full bg-background/80 text-xs"
                    >
                      <SelectValue placeholder="Assign..." />
                    </SelectTrigger>
                    <SelectContent>
                      {REASSIGN_TARGETS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {PHOTO_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
