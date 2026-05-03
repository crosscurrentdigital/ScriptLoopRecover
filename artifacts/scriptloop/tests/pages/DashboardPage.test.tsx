import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/components/AudioQuotaBadge", () => ({
  AudioQuotaBadge: () => null,
}));

const { default: DashboardPage } = await import("@/pages/DashboardPage");

function wrap(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function mockJson(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    headers: new Headers(),
    json: async () => body,
  };
}

beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DashboardPage", () => {
  it("shows skeleton then empty state when no scripts", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJson([]),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<DashboardPage />, { wrapper: wrap(qc) });
    await waitFor(() =>
      expect(screen.getByText(/No scripts yet/)).toBeInTheDocument(),
    );
  });

  it("shows network error state when fetch fails", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJson({ error: { code: "x", message: "boom" } }, 500),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<DashboardPage />, { wrapper: wrap(qc) });
    await waitFor(() =>
      expect(
        screen.getByText(/Couldn't load your scripts/),
      ).toBeInTheDocument(),
    );
  });

  it("renders the New script button as a link to /scripts/new", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockJson([]),
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<DashboardPage />, { wrapper: wrap(qc) });
    const link = await screen.findByRole("link", { name: /New script/i });
    expect(link).toHaveAttribute("href", "/scripts/new");
  });

  it("renders scripts when loaded", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (url === "/api/scripts") {
          return Promise.resolve(
            mockJson([
              {
                id: 1,
                userId: "u",
                title: "Mine",
                content: "c",
                audioUrl: null,
                audioSource: null,
                voiceId: null,
                loopGapSeconds: 2,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ]),
          );
        }
        return Promise.resolve(mockJson([]));
      },
    );
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<DashboardPage />, { wrapper: wrap(qc) });
    expect(await screen.findByText("Mine")).toBeInTheDocument();
    expect(screen.getByText(/1 script/)).toBeInTheDocument();
  });
});
