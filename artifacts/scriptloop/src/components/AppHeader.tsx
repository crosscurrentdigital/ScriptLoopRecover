import { Link, NavLink, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { BrandMark, BRAND } from "@/lib/brand";
import { useMe } from "@/lib/api";

const font = { fontFamily: BRAND.font };

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "inline-flex min-h-11 items-center px-1 text-sm font-medium transition-colors md:min-h-0",
          isActive
            ? "text-zinc-900"
            : "text-zinc-600 hover:text-zinc-900",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <span className="relative">
          {children}
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
              style={{ background: BRAND.colors.teal }}
            />
          )}
        </span>
      )}
    </NavLink>
  );
}

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
    <header
      className="border-b border-zinc-200"
      style={{ background: BRAND.colors.paper }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 md:px-10">
        <Link
          to="/dashboard"
          aria-label={`${BRAND.name} home`}
          className="inline-flex min-h-11 items-center gap-2 text-zinc-900 active:opacity-80 sm:min-h-0 sm:hover:opacity-80"
        >
          <BrandMark className="h-7 w-7" title={`${BRAND.name} logo`} />
          <span
            className="text-xl font-bold tracking-tight"
            style={font}
          >
            {BRAND.name}
          </span>
        </Link>
        <nav className="flex items-center gap-4 md:gap-6">
          <div className="hidden items-center gap-5 md:flex">
            <NavItem to="/dashboard">Dashboard</NavItem>
            <NavItem to="/settings">Settings</NavItem>
            {isAdmin && <NavItem to="/admin">Admin</NavItem>}
          </div>
          {user?.email && (
            <span
              className="hidden max-w-[200px] truncate text-xs text-zinc-500 lg:inline"
              title={user.email}
            >
              {user.email}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="rounded-full border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            Sign out
          </Button>
        </nav>
      </div>
      {/* Mobile sub-nav (only below md breakpoint) */}
      <div className="flex items-center gap-5 border-t border-zinc-200 px-4 py-2 md:hidden">
        <NavItem to="/dashboard">Dashboard</NavItem>
        <NavItem to="/settings">Settings</NavItem>
        {isAdmin && <NavItem to="/admin">Admin</NavItem>}
      </div>
    </header>
  );
}

export default AppHeader;
