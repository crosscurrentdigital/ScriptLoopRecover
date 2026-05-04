import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { BrandMark, BRAND } from "@/lib/brand";

const font = { fontFamily: BRAND.font };

function NotFoundContent({ isAuthed }: { isAuthed: boolean }) {
  const target = isAuthed ? "/dashboard" : "/sign-in";
  const targetLabel = isAuthed ? "Back to dashboard" : "Go to sign in";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <BrandMark className="h-10 w-10 opacity-60" />
      <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">
        Error · 404
      </div>
      <h1
        className="font-bold tracking-tight text-zinc-900"
        style={{ ...font, fontSize: "clamp(48px, 7vw, 88px)", lineHeight: 1 }}
      >
        Lost the thread.
      </h1>
      <p className="max-w-md text-sm text-zinc-500">
        That page doesn&rsquo;t exist — or it wandered off mid-loop.
      </p>
      <Button
        asChild
        className="mt-2 rounded-full px-6"
        style={{ background: BRAND.colors.violet }}
      >
        <Link to={target}>{targetLabel}</Link>
      </Button>
    </div>
  );
}

export default function NotFoundPage() {
  const session = authClient.useSession();

  if (session.isPending) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: BRAND.colors.paper }}
      >
        <Spinner />
      </div>
    );
  }

  const isAuthed = !!session.data;

  if (isAuthed) {
    return (
      <ErrorBoundary>
        <div
          className="flex min-h-screen flex-col"
          style={{ background: BRAND.colors.paper, ...font }}
        >
          <AppHeader />
          <NotFoundContent isAuthed />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: BRAND.colors.paper, ...font }}
    >
      <NotFoundContent isAuthed={false} />
    </div>
  );
}
