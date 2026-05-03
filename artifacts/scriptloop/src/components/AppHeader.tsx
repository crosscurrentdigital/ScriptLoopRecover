import { Link, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { BrandMark, BRAND } from "@/lib/brand";
import { useMe } from "@/lib/api";

export function AppHeader() {
  const session = authClient.useSession();
  const me = useMe();
  const navigate = useNavigate();
  const user = session.data?.user;
  const isAdmin = me.data?.isAdmin ?? false;

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
          aria-label={`${BRAND.name} home`}
          className="inline-flex min-h-11 items-center gap-2 active:opacity-80 sm:min-h-0 sm:hover:opacity-80"
        >
          <BrandMark className="h-7 w-7" title={`${BRAND.name} logo`} />
          <span
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: BRAND.font }}
          >
            {BRAND.name}
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings">Settings</Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">Admin</Link>
            </Button>
          )}
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
