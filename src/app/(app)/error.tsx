"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Without this, an uncaught error anywhere under the app shell (a thrown exception a
// component's own try/catch didn't cover, a lost client context after returning from the
// mobile camera app, etc.) leaves the user on a blank screen until they manually refresh —
// Next.js has nothing to catch it with otherwise. This gives them a way back without losing
// the tab/session.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-medium text-foreground">Something went wrong.</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
