import { Navigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { ApiError, useMe } from "@/lib/api";
import { AccountDisabledScreen } from "@/components/AccountDisabledScreen";

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  // useMe runs against /api/me, which now returns 403 `account_disabled`
  // for disabled accounts. We resolve the disabled state here, before any
  // protected page mounts and starts firing requests that would all fail
  // with the same 403, so the user sees a clear screen. Gated on the
  // auth session being resolved so we don't fire an unauthenticated
  // request during bootstrap.
  const hasSession = !session.isPending && !!session.data;
  const me = useMe({ enabled: hasSession });
  if (session.isPending) return <Spinner />;
  if (!session.data) return <Navigate to="/sign-in" replace />;
  if (me.isLoading) return <Spinner />;
  if (
    me.error instanceof ApiError &&
    me.error.status === 403 &&
    me.error.code === "account_disabled"
  ) {
    return <AccountDisabledScreen />;
  }
  if (me.data?.disabled) return <AccountDisabledScreen />;
  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  if (session.isPending) return <Spinner />;
  if (session.data) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
