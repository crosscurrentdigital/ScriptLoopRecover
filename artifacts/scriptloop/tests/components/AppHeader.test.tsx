import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const useSessionMock = vi.fn();
const signOutMock = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: useSessionMock, signOut: signOutMock },
}));

const { AppHeader } = await import("@/components/AppHeader");

beforeEach(() => {
  useSessionMock.mockReset();
  signOutMock.mockReset();
});
afterEach(() => cleanup());

function renderAt(path = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/sign-in" element={<div data-testid="sign-in" />} />
        <Route path="*" element={<AppHeader />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppHeader", () => {
  it("renders the brand link and Dashboard nav", () => {
    useSessionMock.mockReturnValue({ data: null });
    renderAt();
    expect(screen.getByText("ScriptLoop")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("shows the user email when present", () => {
    useSessionMock.mockReturnValue({
      data: { user: { email: "u@x.com" } },
    });
    renderAt();
    expect(screen.getByText("u@x.com")).toBeInTheDocument();
  });

  it("signs out and navigates to /sign-in", async () => {
    useSessionMock.mockReturnValue({ data: { user: { email: "u@x.com" } } });
    signOutMock.mockResolvedValue(undefined);
    renderAt();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await Promise.resolve();
    await Promise.resolve();
    expect(signOutMock).toHaveBeenCalled();
    expect(await screen.findByTestId("sign-in")).toBeInTheDocument();
  });

  it("hides email span when no user", () => {
    useSessionMock.mockReturnValue({ data: { user: {} } });
    renderAt();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });
});
