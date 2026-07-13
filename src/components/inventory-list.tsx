"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Category, ItemStatus } from "@prisma/client";
import { bulkArchiveItems, bulkDeleteItems } from "@/actions/items";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface InventoryListItem {
  id: string;
  name: string;
  category: Category;
  status: ItemStatus;
}

const CONFIRM_TEXT = "DELETE";

export function InventoryList({
  items,
  showArchived,
}: {
  items: InventoryListItem[];
  showArchived: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const allSelected = items.length > 0 && selected.size === items.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleArchiveSelected() {
    const ids = Array.from(selected);
    startTransition(async () => {
      await bulkArchiveItems(ids);
      clearSelection();
    });
  }

  function handleConfirmDelete() {
    const ids = Array.from(selected);
    startTransition(async () => {
      await bulkDeleteItems(ids);
      clearSelection();
      setDeleteDialogOpen(false);
      setConfirmText("");
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
        <span className="text-sm text-muted-foreground">
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </span>
        {selected.size > 0 && (
          <div className="ml-auto flex gap-2">
            {showArchived ? (
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete selected
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={handleArchiveSelected}
              >
                Archive selected
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <Checkbox
              checked={selected.has(item.id)}
              onCheckedChange={() => toggleOne(item.id)}
              aria-label={`Select ${item.name}`}
            />
            <Link
              href={`/items/${item.id}`}
              className="font-medium text-foreground hover:underline"
            >
              {item.name}
            </Link>
            <span className="ml-auto flex items-center gap-3">
              <span className="text-muted-foreground">{item.category}</span>
              <StatusBadge status={item.status} />
            </span>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Permanently delete {selected.size} item{selected.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the item, its specs, test logs, and photos entirely — including the
              photo files in storage. This cannot be undone. Type {CONFIRM_TEXT} to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_TEXT}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={confirmText !== CONFIRM_TEXT || isPending}
              onClick={handleConfirmDelete}
            >
              {isPending ? "Deleting..." : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
