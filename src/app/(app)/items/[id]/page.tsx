import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { notFound } from "next/navigation";
import type { PhotoType, TestResult } from "@prisma/client";
import { getItemById } from "@/lib/items";
import { createDownloadUrl } from "@/lib/r2";
import { buildChecklistRows } from "@/lib/checklists";
import { PageHeader } from "@/components/page-header";
import { StatusChanger } from "@/components/status-changer";
import { PhotoUploader } from "@/components/photo-uploader";
import { QuickCaptureUploader } from "@/components/quick-capture-uploader";
import { PhotoGallery, PHOTO_TYPE_LABELS, type GalleryPhoto } from "@/components/photo-gallery";
import { TestChecklist, type EvidencePhotoOption } from "@/components/test-checklist";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const resultCounts = checklistRows.reduce(
    (acc, row) => {
      acc[row.result] += 1;
      return acc;
    },
    { PASS: 0, FAIL: 0, PENDING: 0 } as Record<TestResult, number>,
  );

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

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ItemForm item={item} />
        </TabsContent>

        <TabsContent value="photos">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <QuickCaptureUploader itemId={item.id} />
              {PHOTO_TYPES.map(({ type, label }) => (
                <PhotoUploader key={type} itemId={item.id} photoType={type} label={label} />
              ))}
            </div>
            <PhotoGallery photos={photos} />
          </div>
        </TabsContent>

        <TabsContent value="testing">
          <Collapsible>
            <CollapsibleTrigger className="group flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium text-foreground">Testing checklist</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {resultCounts.PASS} pass · {resultCounts.FAIL} fail · {resultCounts.PENDING} pending
                <ChevronDown className="size-4 transition-transform group-data-panel-open:rotate-180" />
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-3">
                <TestChecklist
                  itemId={item.id}
                  rows={checklistRows}
                  evidenceOptions={evidenceOptions}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>
      </Tabs>
    </div>
  );
}
