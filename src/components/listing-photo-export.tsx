"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PHOTO_TYPE_LABELS, PHOTO_TYPE_ORDER, type GalleryPhoto } from "@/components/photo-gallery";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Deliberately not filtered/gated by PhotoType or any listing state — export is the user's
// choice, every photo starts selected, and PhotoType tagging stays purely organizational.
export function ListingPhotoExport({ itemId, photos }: { itemId: string; photos: GalleryPhoto[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(photos.map((p) => p.id)));

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">No photos on this item yet.</p>;
  }

  function toggle(photoId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  const grouped = PHOTO_TYPE_ORDER.map((type) => ({
    type,
    items: photos.filter((photo) => photo.type === type),
  })).filter((group) => group.items.length > 0);

  const downloadHref = `/api/items/${itemId}/listing-photos?${Array.from(selected)
    .map((id) => `photoId=${encodeURIComponent(id)}`)
    .join("&")}`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pick whichever photos to include — any type works, this isn&apos;t limited to photos
        tagged &quot;Listing&quot;.
      </p>
      {grouped.map((group) => (
        <div key={group.type} className="space-y-2">
          <p className="text-sm font-medium text-foreground">{PHOTO_TYPE_LABELS[group.type]}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {group.items.map((photo) => {
              const isSelected = selected.has(photo.id);
              return (
                <div
                  key={photo.id}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => toggle(photo.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(photo.id);
                    }
                  }}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-border bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived
                      R2 URLs; next/image's optimizer/caching isn't a fit for expiring auth tokens */}
                  <img src={photo.url} alt="" className="size-full object-cover" />
                  {!isSelected && <div className="absolute inset-0 bg-background/60" />}
                  <Checkbox
                    checked={isSelected}
                    className="pointer-events-none absolute top-1 right-1 bg-background"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          onClick={() => setSelected(new Set(photos.map((p) => p.id)))}
        >
          Select all
        </button>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          onClick={() => setSelected(new Set())}
        >
          Deselect all
        </button>
        <a
          href={selected.size > 0 ? downloadHref : undefined}
          aria-disabled={selected.size === 0}
          onClick={(e) => {
            if (selected.size === 0) e.preventDefault();
          }}
          className={cn(
            buttonVariants({ size: "sm" }),
            selected.size === 0 && "pointer-events-none opacity-50",
          )}
        >
          Download .zip ({selected.size})
        </a>
      </div>
    </div>
  );
}
