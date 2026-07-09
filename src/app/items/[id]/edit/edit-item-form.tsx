"use client";

import { useActionState, useState } from "react";
import { Category, ItemStatus } from "@prisma/client";
import { archiveItem, updateItem } from "@/actions/items";
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

interface Spec {
  key: string;
  value: string;
}

export interface EditableItem {
  id: string;
  name: string;
  category: Category;
  status: ItemStatus;
  costPence: number;
  feesPence: number;
  soldPricePence: number | null;
  specs: Spec[];
}

export function EditItemForm({ item }: { item: EditableItem }) {
  const [state, formAction, pending] = useActionState(updateItem, undefined);
  const [specs, setSpecs] = useState<Spec[]>(
    item.specs.map(({ key, value }) => ({ key, value })),
  );

  function updateSpec(index: number, field: keyof Spec, value: string) {
    setSpecs((prev) =>
      prev.map((spec, i) => (i === index ? { ...spec, [field]: value } : spec)),
    );
  }

  function addSpec() {
    setSpecs((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeSpec(index: number) {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="specs" value={JSON.stringify(specs)} />

        {state?.formError && (
          <p className="text-sm text-red-500">{state.formError}</p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={item.name} required />
          {state?.fieldErrors?.name && (
            <p className="text-sm text-red-500">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select name="category" defaultValue={item.category}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Category).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={item.status}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ItemStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="costPence">Cost (pence)</Label>
            <Input
              id="costPence"
              name="costPence"
              type="number"
              min={0}
              defaultValue={item.costPence}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feesPence">Fees (pence)</Label>
            <Input
              id="feesPence"
              name="feesPence"
              type="number"
              min={0}
              defaultValue={item.feesPence}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="soldPricePence">Sold price (pence)</Label>
            <Input
              id="soldPricePence"
              name="soldPricePence"
              type="number"
              min={0}
              defaultValue={item.soldPricePence ?? ""}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Specs</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSpec}>
              Add spec
            </Button>
          </div>
          {specs.map((spec, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Key"
                value={spec.key}
                onChange={(e) => updateSpec(index, "key", e.target.value)}
              />
              <Input
                placeholder="Value"
                value={spec.value}
                onChange={(e) => updateSpec(index, "value", e.target.value)}
              />
              <Button type="button" variant="outline" onClick={() => removeSpec(index)}>
                Remove
              </Button>
            </div>
          ))}
          {state?.fieldErrors?.specs && (
            <p className="text-sm text-red-500">{state.fieldErrors.specs[0]}</p>
          )}
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </form>

      <form action={archiveItem.bind(null, item.id)}>
        <Button type="submit" variant="outline">
          Archive
        </Button>
      </form>
    </div>
  );
}
