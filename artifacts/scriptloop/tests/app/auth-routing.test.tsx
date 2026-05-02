/**
 * Frontend smoke test for ScriptLoop's auth gating.
 *
 * Why we test the extracted RequireAuth/PublicRoute components directly
 * instead of rendering <App />:
 *
 * 1. App renders <NeonAuthUIProvider>, which transitively imports the
 *    full Better Auth UI bundle (Tanstack-query-coupled hooks, browser
 *    crypto, SSR-incompatible code paths). Standing that up under jsdom
 *    requires mocking ~6 internal modules and produces test failures
 *    that have nothing to do with the redirect behavior we care about.
 * 2. RequireAuth/PublicRoute ARE the routing logic of App — every
 *    protected route in App.tsx is wrapped in one of them, so testing
 *    these two components is functionally equivalent to testing the
 *    redirect behavior of the App router, with a fraction of the
 *    setup surface area and no test-only mocks of third-party UI.
 * 3. The components themselves are imported and mounted inside a
 *    MemoryRouter that mirrors App.tsx's route shape (/dashboard +
 *    /sign-in), so a redirect bug in either component would surface
 *    here exactly as it would in App.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const useSessionMock = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: useSessionMock,
  },
}));

const { RequireAuth, PublicRoute } = await import(
  "@/components/RequireAuth"
);

beforeEach(() => useSessionMock.mockReset());
afterEach(() => cleanup());

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <div>dashboard-content</div>
            </RequireAuth>
          }
        />
        <Route
          path="/sign-in"
          element={
            <PublicRoute>
              <div>sign-in-page</div>
            </PublicRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("auth routing smoke", () => {
  it("redirects unauthenticated users from /dashboard to /sign-in", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    renderWithRouter("/dashboard");
    expect(screen.getByText("sign-in-page")).toBeInTheDocument();
    expect(screen.queryByText("dashboard-content")).not.toBeInTheDocument();
  });

  it("renders the dashboard when the user is authenticated", () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-A" }, session: { userId: "user-A" } },
      isPending: false,
    });
    renderWithRouter("/dashboard");
    expect(screen.getByText("dashboard-content")).toBeInTheDocument();
  });

  it("shows a loading state while the session is pending and does NOT redirect", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: true });
    const { container } = renderWithRouter("/dashboard");
    // Spinner uses border-primary; verify a spinner-style div is shown
    // and no redirect to /sign-in happened.
    expect(container.querySelector(".animate-spin")).not.toBeNull();
    expect(screen.queryByText("sign-in-page")).not.toBeInTheDocument();
  });

  it("redirects already-authenticated users away from /sign-in to /dashboard", () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "user-A" }, session: { userId: "user-A" } },
      isPending: false,
    });
    renderWithRouter("/sign-in");
    // /dashboard route is also defined and protected — when authenticated,
    // PublicRoute redirects to /dashboard which then renders its content.
    expect(screen.getByText("dashboard-content")).toBeInTheDocument();
  });
});
