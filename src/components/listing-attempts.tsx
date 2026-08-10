"use client";

import { useActionState, useState, useTransition } from "react";
import type { Listing, ListingPlatform, ListingStatus } from "@prisma/client";
import { createListing, deleteListing, updateListingStatus } from "@/actions/listings";
import { formatPence, poundsInputToPenceValue } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLATFORM_LABELS: Record<ListingPlatform, string> = {
  EBAY: "eBay",
  FACEBOOK_MARKETPLACE: "Facebook Marketplace",
  OTHER: "Other",
};

const STATUS_OPTIONS: { value: ListingStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "LISTED", label: "Listed" },
  { value: "SOLD", label: "Sold" },
];

export type ListingRow = Pick<
  Listing,
  "id" | "platform" | "url" | "status" | "pricePence" | "createdAt"
>;

function ListingRowItem({ listing }: { listing: ListingRow }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: ListingStatus) {
    startTransition(async () => {
      await updateListingStatus(listing.id, status);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteListing(listing.id);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium text-foreground">
          {PLATFORM_LABELS[listing.platform]} · {formatPence(listing.pricePence)}
        </p>
        {listing.url && (
          <a
            href={listing.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground underline"
          >
            {listing.url}
          </a>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={listing.status}
          onValueChange={(value) => handleStatusChange(value as ListingStatus)}
          disabled={isPending}
        >
          <SelectTrigger size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

function AddListingForm({ itemId }: { itemId: string }) {
  const [state, formAction, pending] = useActionState(createListing, undefined);
  const [pounds, setPounds] = useState("");

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-3">
      <input type="hidden" name="itemId" value={itemId} />
      <div className="space-y-1.5">
        <Label htmlFor="platform">Platform</Label>
        <Select name="platform" defaultValue="EBAY">
          <SelectTrigger id="platform" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="url">Listing URL</Label>
        <Input id="url" name="url" placeholder="https://..." className="w-56" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pricePence">Price</Label>
        <div className="relative w-28">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
            £
          </span>
          <Input
            id="pricePence"
            type="number"
            step="0.01"
            min={0}
            className="pl-6"
            value={pounds}
            onChange={(e) => setPounds(e.target.value)}
          />
        </div>
        <input type="hidden" name="pricePence" value={poundsInputToPenceValue(pounds)} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding..." : "Add listing"}
      </Button>
      {state?.formError && <p className="w-full text-sm text-destructive">{state.formError}</p>}
    </form>
  );
}

// Sale-driven behavior (auto-closing sibling listings, wiring soldPricePence) is Section 12's
// job — this only tracks each listing attempt's own draft/listed/sold status independently.
export function ListingAttempts({ itemId, listings }: { itemId: string; listings: ListingRow[] }) {
  return (
    <div className="space-y-3">
      {listings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No listing attempts yet.</p>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => (
            <ListingRowItem key={listing.id} listing={listing} />
          ))}
        </div>
      )}
      <AddListingForm itemId={itemId} />
    </div>
  );
}
