import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AudioQuotaBadge } from "@/components/AudioQuotaBadge";
import { audioQuotaQueryKey } from "@/lib/api";
import type { ReactNode } from "react";

function withQc(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AudioQuotaBadge", () => {
  it("renders nothing while loading", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}),
    );
    const { container } = render(<AudioQuotaBadge />, { wrapper: withQc(qc) });
    expect(container.firstChild).toBeNull();
  });

  it("renders 'X / Y left' when remaining > 3", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    qc.setQueryData(audioQuotaQueryKey, {
      used: 5,
      limit: 20,
      resetsAt: new Date(Date.now() + 60_000).toISOString(),
    });
    render(<AudioQuotaBadge />, { wrapper: withQc(qc) });
    expect(screen.getByText(/15 \/ 20/)).toBeInTheDocument();
  });

  it("shows exhausted state with reset countdown", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    qc.setQueryData(audioQuotaQueryKey, {
      used: 20,
      limit: 20,
      resetsAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    });
    render(<AudioQuotaBadge />, { wrapper: withQc(qc) });
    expect(screen.getByText(/Hourly limit reached/)).toBeInTheDocument();
  });

  it("renders a 'low remaining' state when remaining ≤ 3", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    qc.setQueryData(audioQuotaQueryKey, {
      used: 18,
      limit: 20,
      resetsAt: new Date(Date.now() + 60_000).toISOString(),
    });
    render(<AudioQuotaBadge />, { wrapper: withQc(qc) });
    expect(screen.getByText(/2 \/ 20/)).toBeInTheDocument();
  });

  it("formats reset hours when >60 minutes", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    qc.setQueryData(audioQuotaQueryKey, {
      used: 20,
      limit: 20,
      resetsAt: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
    });
    render(<AudioQuotaBadge />, { wrapper: withQc(qc) });
    expect(screen.getByText(/\d+h/)).toBeInTheDocument();
  });
});
