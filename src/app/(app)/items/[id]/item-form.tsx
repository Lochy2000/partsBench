"use client";

import { useActionState, useState } from "react";
import { Category } from "@prisma/client";
import { archiveItem, updateItem } from "@/actions/items";
import { penceToPoundsInput, poundsInputToPenceValue } from "@/lib/currency";
import { getSpecTemplateKeysForCategory } from "@/lib/spec-templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface Spec {
  key: string;
  value: string;
}

export interface ItemFormData {
  id: string;
  name: string;
  category: Category;
  costPence: number;
  feesPence: number;
  soldPricePence: number | null;
  notes: string | null;
  specs: Spec[];
}

function MoneyField({
  id,
  label,
  defaultPence,
}: {
  id: string;
  label: string;
  defaultPence: number | null;
}) {
  const [pounds, setPounds] = useState(
    defaultPence === null ? "" : penceToPoundsInput(defaultPence),
  );

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
          £
        </span>
        <Input
          id={id}
          type="number"
          step="0.01"
          min={0}
          className="pl-6"
          value={pounds}
          onChange={(e) => setPounds(e.target.value)}
        />
      </div>
      <input type="hidden" name={id} value={poundsInputToPenceValue(pounds)} />
    </div>
  );
}

export function ItemForm({ item }: { item: ItemFormData }) {
  const [state, formAction, pending] = useActionState(updateItem, undefined);
  const [category, setCategory] = useState<Category>(item.category);
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

  function addSpecFromTemplate(key: string) {
    setSpecs((prev) => {
      const alreadyAdded = prev.some(
        (spec) => spec.key.trim().toLowerCase() === key.toLowerCase(),
      );
      return alreadyAdded ? prev : [...prev, { key, value: "" }];
    });
  }

  function removeSpec(index: number) {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  }

  const specTemplateKeys = getSpecTemplateKeysForCategory(category);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="specs" value={JSON.stringify(specs)} />

            {state?.formError && (
              <p className="text-sm text-destructive">{state.formError}</p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={item.name} required />
              {state?.fieldErrors?.name && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.name[0]}
                </p>
              )}
            </div>

            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select
                name="category"
                value={category}
                onValueChange={(value) => setCategory(value as Category)}
              >
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MoneyField id="costPence" label="Cost" defaultPence={item.costPence} />
              <MoneyField id="feesPence" label="Fees" defaultPence={item.feesPence} />
              <MoneyField
                id="soldPricePence"
                label="Sold price"
                defaultPence={item.soldPricePence}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Specs</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                  Add spec
                </Button>
              </div>
              {specTemplateKeys.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {specTemplateKeys.map((key) => {
                    const alreadyAdded = specs.some(
                      (spec) => spec.key.trim().toLowerCase() === key.toLowerCase(),
                    );
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant={alreadyAdded ? "secondary" : "outline"}
                        size="sm"
                        disabled={alreadyAdded}
                        onClick={() => addSpecFromTemplate(key)}
                      >
                        {key}
                      </Button>
                    );
                  })}
                </div>
              )}
              {specs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No specs yet — add one below.
                </p>
              )}
              {specs.map((spec, index) => (
                <div key={index} className="flex flex-col gap-2 sm:flex-row">
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeSpec(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {state?.fieldErrors?.specs && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.specs[0]}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Anything worth remembering — where it came from, what's missing, what the seller said..."
                defaultValue={item.notes ?? ""}
              />
              {state?.fieldErrors?.notes && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.notes[0]}
                </p>
              )}
            </div>

            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          Archiving hides this item everywhere except direct links — it&apos;s never
          deleted.
        </p>
        <form action={archiveItem.bind(null, item.id)}>
          <Button type="submit" variant="outline">
            Archive
          </Button>
        </form>
      </div>
    </div>
  );
}
