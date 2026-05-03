import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "@/pages/Landing";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

import { vi } from "vitest";
vi.mock("@neondatabase/auth/react/ui", () => ({
  AuthView: ({ pathname }: { pathname: string }) => (
    <div data-testid="auth-view">{pathname}</div>
  ),
}));

afterEach(() => cleanup());

describe("static pages render", () => {
  it("Landing renders hero + features", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("AI voices")).toBeInTheDocument();
    expect(screen.getByText("Zen Mode")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Start memorizing/ }),
    ).toHaveAttribute("href", "/sign-up");
  });

  it("PrivacyPage shows the policy heading and audio posture", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: /Privacy Policy/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Audio URL privacy posture/)).toBeInTheDocument();
  });

  it("TermsPage shows acceptable use rules", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: /Terms of Service/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Acceptable use/)).toBeInTheDocument();
  });

  it("LoginPage mounts AuthView with /sign-in pathname", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("auth-view")).toHaveTextContent("/sign-in");
  });

  it("RegisterPage mounts AuthView with /sign-up and Terms link", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("auth-view")).toHaveTextContent("/sign-up");
    expect(screen.getAllByRole("link", { name: "Terms" }).length).toBeGreaterThan(0);
  });
});
