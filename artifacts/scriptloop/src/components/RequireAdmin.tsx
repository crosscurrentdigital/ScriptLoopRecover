import { Navigate } from "react-router-dom";
import { useMe } from "@/lib/api";

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const me = useMe();
  if (me.isPending) return <Spinner />;
  if (me.error || !me.data) return <Navigate to="/dashboard" replace />;
  if (me.data.disabled) return <Navigate to="/sign-in" replace />;
  if (!me.data.isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
