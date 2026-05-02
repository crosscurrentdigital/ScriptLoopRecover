/**
 * Minimal smoke test that renders <App /> itself (not just the extracted
 * RequireAuth/PublicRoute) so that a regression in App.tsx route wiring —
 * for example, a /dashboard route that forgets its <ProtectedRoute>
 * wrapper — would fail this test. Heavyweight providers (NeonAuthUI,
 * Sentry trigger) are stubbed; only the routing surface is exercised.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const useSessionMock = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: useSessionMock },
}));
vi.mock("@neondatabase/auth/react/ui", () => ({
  NeonAuthUIProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock("@/components/SentryTestTrigger", () => ({
  SentryTestTrigger: () => null,
}));
vi.mock("@/components/ui/toaster", () => ({ Toaster: () => null }));
// Page components reach into Neon Auth UI, fetch hooks, etc. We're only
// testing route wiring here, so render them as inert markers.
vi.mock("@/pages/LoginPage", () => ({
  default: () => <div data-testid="login-page">login</div>,
}));
vi.mock("@/pages/RegisterPage", () => ({
  default: () => <div data-testid="register-page">register</div>,
}));
vi.mock("@/pages/DashboardPage", () => ({
  default: () => <div data-testid="dashboard-page">dashboard</div>,
}));
vi.mock("@/pages/ScriptEditorPage", () => ({ default: () => <div /> }));
vi.mock("@/pages/ScriptDetailPage", () => ({ default: () => <div /> }));
vi.mock("@/pages/ZenMode", () => ({ default: () => <div /> }));
vi.mock("@/pages/Landing", () => ({
  default: () => <div data-testid="landing-page">landing</div>,
}));
vi.mock("@/pages/PrivacyPage", () => ({
  default: () => <div data-testid="privacy-page">privacy policy</div>,
}));
vi.mock("@/pages/TermsPage", () => ({ default: () => <div /> }));
vi.mock("@/pages/NotFoundPage", () => ({ default: () => <div /> }));
vi.mock("@/components/AppHeader", () => ({ AppHeader: () => null }));
vi.mock("@/components/Footer", () => ({ Footer: () => null }));
vi.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const App = (await import("@/App")).default;

beforeEach(() => useSessionMock.mockReset());
afterEach(() => cleanup());

describe("App route wiring smoke", () => {
  it("redirects unauthenticated users from /dashboard to /sign-in (LoginPage)", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    window.history.pushState({}, "", "/dashboard");
    render(<App />);
    expect(screen.getByTestId("login-page")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-page")).not.toBeInTheDocument();
  });

  it("redirects authenticated users from / to /dashboard", () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-A" }, session: { userId: "user-A" } },
      isPending: false,
    });
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-page")).not.toBeInTheDocument();
  });

  it("renders the public privacy page without redirecting", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    window.history.pushState({}, "", "/privacy");
    render(<App />);
    expect(screen.getByTestId("privacy-page")).toBeInTheDocument();
  });

  it("renders the unauthenticated landing on /", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
  });
});
