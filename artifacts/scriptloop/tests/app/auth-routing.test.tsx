// Unit tests for RequireAuth / PublicRoute. App-level wiring is covered
// in app-routing.test.tsx.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const useSessionMock = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: useSessionMock,
  },
}));

// RequireAuth now also calls useMe() to detect disabled accounts. Keep
// it stubbed so these routing tests stay focused on the session flow.
vi.mock("@/lib/api", () => ({
  useMe: () => ({
    data: { isAdmin: false, disabled: false, userId: "u", email: "u@x.com" },
    isLoading: false,
    error: null,
  }),
  ApiError: class extends Error {},
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
