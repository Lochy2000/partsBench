"use client";

import { useOptimistic, useTransition } from "react";
import type { ItemStatus } from "@prisma/client";
import { updateItemStatus } from "@/actions/items";
import { STATUS_DOT_CLASS, STATUS_LABELS } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_VALUES = Object.keys(STATUS_LABELS) as ItemStatus[];

export function StatusChanger({
  itemId,
  status,
}: {
  itemId: string;
  status: ItemStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);

  function handleChange(next: ItemStatus) {
    startTransition(async () => {
      setOptimisticStatus(next);
      await updateItemStatus(itemId, next);
    });
  }

  return (
    <Select
      value={optimisticStatus}
      onValueChange={(next) => handleChange(next as ItemStatus)}
      disabled={isPending}
    >
      <SelectTrigger className="w-[170px]">
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            STATUS_DOT_CLASS[optimisticStatus],
          )}
        />
        <SelectValue>{STATUS_LABELS[optimisticStatus]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_VALUES.map((value) => (
          <SelectItem key={value} value={value}>
            <span
              aria-hidden
              className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT_CLASS[value])}
            />
            {STATUS_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
