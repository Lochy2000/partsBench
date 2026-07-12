import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import type { PhotoType } from "@prisma/client";
import { getItemById } from "@/lib/items";
import { createDownloadUrl } from "@/lib/r2";
import { buildChecklistRows } from "@/lib/checklists";
import { PageHeader } from "@/components/page-header";
import { StatusChanger } from "@/components/status-changer";
import { PhotoUploader } from "@/components/photo-uploader";
import { PhotoGallery, PHOTO_TYPE_LABELS, type GalleryPhoto } from "@/components/photo-gallery";
import { TestChecklist, type EvidencePhotoOption } from "@/components/test-checklist";
import { ItemForm } from "./item-form";

const PHOTO_TYPES: { type: PhotoType; label: string }[] = [
  { type: "BEFORE", label: "Before photo" },
  { type: "AFTER", label: "After photo" },
  { type: "TEST", label: "Test photo" },
  { type: "LISTING", label: "Listing photo" },
];

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    notFound();
  }

  const photos: GalleryPhoto[] = await Promise.all(
    item.photos.map(async (photo) => ({
      id: photo.id,
      type: photo.type,
      url: await createDownloadUrl(photo.storageKey),
    })),
  );

  const photoTypeCounts: Partial<Record<PhotoType, number>> = {};
  const evidenceOptions: EvidencePhotoOption[] = item.photos.map((photo) => {
    const count = (photoTypeCounts[photo.type] ?? 0) + 1;
    photoTypeCounts[photo.type] = count;
    return { id: photo.id, label: `${PHOTO_TYPE_LABELS[photo.type]} #${count}` };
  });

  const checklistRows = buildChecklistRows(item.category, item.testLogs);

  return (
    <div className="max-w-2xl">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
      <PageHeader
        title={item.name}
        description={item.category}
        action={<StatusChanger itemId={item.id} status={item.status} />}
      />

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {PHOTO_TYPES.map(({ type, label }) => (
            <PhotoUploader key={type} itemId={item.id} photoType={type} label={label} />
          ))}
        </div>
        <PhotoGallery photos={photos} />
      </div>

      <div className="mt-6 space-y-2">
        <h2 className="text-sm font-medium text-foreground">Testing checklist</h2>
        <TestChecklist
          itemId={item.id}
          rows={checklistRows}
          evidenceOptions={evidenceOptions}
        />
      </div>

      <div className="mt-6">
        <ItemForm item={item} />
      </div>
    </div>
  );
}
