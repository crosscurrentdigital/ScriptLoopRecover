import { Link, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const session = authClient.useSession();
  const navigate = useNavigate();
  const user = session.data?.user;

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } finally {
      navigate("/sign-in", { replace: true });
    }
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
        <Link
          to="/dashboard"
          className="text-xl font-semibold tracking-tight hover:opacity-80"
        >
          ScriptLoop
        </Link>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          {user?.email && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </nav>
      </div>
    </header>
  );
}

export default AppHeader;
