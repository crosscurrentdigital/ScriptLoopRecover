import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SentryTestTrigger } from "@/components/SentryTestTrigger";

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("SentryTestTrigger", () => {
  it("renders nothing when ?sentry-test is not set", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <SentryTestTrigger />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the trigger button when ?sentry-test=1", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard?sentry-test=1"]}>
        <SentryTestTrigger />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("button", { name: /Throw test error/ }),
    ).toBeInTheDocument();
  });
});
