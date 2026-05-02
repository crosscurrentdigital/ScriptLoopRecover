import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

function NotFoundContent({ isAuthed }: { isAuthed: boolean }) {
  const target = isAuthed ? "/dashboard" : "/sign-in";
  const targetLabel = isAuthed ? "Back to dashboard" : "Go to sign in";
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-muted-foreground">That page doesn't exist.</p>
      <Button asChild variant="outline">
        <Link to={target}>{targetLabel}</Link>
      </Button>
    </div>
  );
}

export default function NotFoundPage() {
  const session = authClient.useSession();

  if (session.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isAuthed = !!session.data;

  if (isAuthed) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-background flex flex-col">
          <AppHeader />
          <NotFoundContent isAuthed />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NotFoundContent isAuthed={false} />
    </div>
  );
}
