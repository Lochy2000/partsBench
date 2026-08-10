"use client";

import { useState } from "react";
import type { ListingDraft as ListingDraftData } from "@/lib/listingTemplate";
import { Button } from "@/components/ui/button";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 text-sm whitespace-pre-wrap text-foreground">
        {value}
      </pre>
    </div>
  );
}

export function ListingDraft({ draft }: { draft: ListingDraftData }) {
  return (
    <div className="space-y-4">
      <CopyField label="Title" value={draft.title} />
      <CopyField label="Description" value={draft.description} />
    </div>
  );
}
