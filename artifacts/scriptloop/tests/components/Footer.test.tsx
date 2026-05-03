import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Footer } from "@/components/Footer";

afterEach(() => cleanup());

describe("Footer", () => {
  it("renders legal nav links and a contact email", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: /Privacy Policy/i }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: /Terms of Service/i }),
    ).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: /Contact/i })).toHaveAttribute(
      "href",
      "mailto:hello@scriptloop.app",
    );
    expect(screen.getByText(/102:18 INC/)).toBeInTheDocument();
  });
});
