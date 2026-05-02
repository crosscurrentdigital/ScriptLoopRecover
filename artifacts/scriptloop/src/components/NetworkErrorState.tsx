import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface NetworkErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function NetworkErrorState({
  title = "Couldn't reach the server",
  message,
  onRetry,
  isRetrying,
}: NetworkErrorStateProps) {
  return (
    <Card className="border-destructive">
      <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-destructive">{title}</p>
          {message && (
            <p className="mt-1 text-sm text-muted-foreground break-words">
              {message}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={isRetrying}
          className="shrink-0"
        >
          {isRetrying ? "Retrying…" : "Try again"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default NetworkErrorState;
