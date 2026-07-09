"use client";

import { useActionState } from "react";
import { Category } from "@prisma/client";
import { createItem } from "@/actions/items";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewItemPage() {
  const [state, formAction, pending] = useActionState(createItem, undefined);

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Quick add</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. RTX 3070"
                autoFocus
                required
              />
              {state?.fieldErrors?.name && (
                <p className="text-sm text-red-500">{state.fieldErrors.name[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue="OTHER">
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Category).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.fieldErrors?.category && (
                <p className="text-sm text-red-500">{state.fieldErrors.category[0]}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Adding..." : "Add item"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
