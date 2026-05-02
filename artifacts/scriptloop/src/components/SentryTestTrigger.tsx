import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Phase 8 acceptance helper. Visible only when the URL contains
 * `?sentry-test=1` (e.g. /dashboard?sentry-test=1) so it doesn't clutter the
 * normal UI but is repeatable from the deployed site.
 */
export function SentryTestTrigger() {
  const [params] = useSearchParams();
  const enabled = params.get("sentry-test") === "1";
  const [shouldThrow, setShouldThrow] = useState(false);

  useEffect(() => {
    if (shouldThrow) {
      throw new Error("Sentry test error (manual trigger)");
    }
  }, [shouldThrow]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 rounded-md border bg-card p-2 shadow-md">
      <Button
        size="sm"
        variant="destructive"
        onClick={() => setShouldThrow(true)}
      >
        Throw test error
      </Button>
    </div>
  );
}

export default SentryTestTrigger;
