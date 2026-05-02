import { Navigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  if (session.isPending) return <Spinner />;
  if (!session.data) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  if (session.isPending) return <Spinner />;
  if (session.data) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
