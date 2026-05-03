import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const useSessionMock = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: useSessionMock, signOut: vi.fn() },
}));
vi.mock("@/components/AppHeader", () => ({
  AppHeader: () => <div data-testid="header" />,
}));

const { default: NotFoundPage } = await import("@/pages/NotFoundPage");

beforeEach(() => useSessionMock.mockReset());
afterEach(() => cleanup());

describe("NotFoundPage", () => {
  it("renders sign-in target for unauthed users", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: false });
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Go to sign in/ }),
    ).toHaveAttribute("href", "/sign-in");
  });

  it("renders dashboard target + header for authed users", () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: "u" } },
      isPending: false,
    });
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to dashboard/ }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("shows spinner while session pending", () => {
    useSessionMock.mockReturnValue({ data: null, isPending: true });
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.queryByText("404")).not.toBeInTheDocument();
  });
});
