"use client";

import { useState, useTransition } from "react";
import type { TestResult } from "@prisma/client";
import { setTestResult } from "@/actions/test-logs";
import type { ChecklistRowData } from "@/lib/checklists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EvidencePhotoOption {
  id: string;
  label: string;
}

const RESULT_OPTIONS: { value: TestResult; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "PASS", label: "Pass" },
  { value: "FAIL", label: "Fail" },
];

const NO_EVIDENCE = "none";

function ChecklistRow({
  itemId,
  row,
  evidenceOptions,
}: {
  itemId: string;
  row: ChecklistRowData;
  evidenceOptions: EvidencePhotoOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<TestResult>(row.result);
  const [notes, setNotes] = useState(row.notes ?? "");
  const [evidencePhotoId, setEvidencePhotoId] = useState(row.evidencePhotoId ?? "");

  function commit(next: {
    result?: TestResult;
    notes?: string;
    evidencePhotoId?: string;
  }) {
    const nextResult = next.result ?? result;
    const nextNotes = next.notes ?? notes;
    const nextEvidence = next.evidencePhotoId ?? evidencePhotoId;

    setResult(nextResult);
    setNotes(nextNotes);
    setEvidencePhotoId(nextEvidence);

    startTransition(async () => {
      await setTestResult({
        itemId,
        checklistItem: row.checklistItem,
        result: nextResult,
        notes: nextNotes.trim() === "" ? null : nextNotes,
        evidencePhotoId: nextEvidence === "" ? null : nextEvidence,
      });
    });
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{row.checklistItem}</p>
        <div className="flex gap-1">
          {RESULT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={result === option.value ? "default" : "outline"}
              disabled={isPending}
              onClick={() => commit({ result: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={evidencePhotoId === "" ? NO_EVIDENCE : evidencePhotoId}
          onValueChange={(value) =>
            commit({ evidencePhotoId: value === NO_EVIDENCE || value === null ? "" : value })
          }
          disabled={isPending || evidenceOptions.length === 0}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="No evidence photo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_EVIDENCE}>No evidence photo</SelectItem>
            {evidenceOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Notes (optional)"
          defaultValue={notes}
          onBlur={(e) => commit({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}

export function TestChecklist({
  itemId,
  rows,
  evidenceOptions,
}: {
  itemId: string;
  rows: ChecklistRowData[];
  evidenceOptions: EvidencePhotoOption[];
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <ChecklistRow
          key={row.checklistItem}
          itemId={itemId}
          row={row}
          evidenceOptions={evidenceOptions}
        />
      ))}
    </div>
  );
}
