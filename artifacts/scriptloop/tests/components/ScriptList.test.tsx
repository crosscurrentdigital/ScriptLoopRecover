import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ScriptList } from "@/components/ScriptList";
import type { ReactNode } from "react";

function wrap(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "",
    headers: new Headers(),
    json: async () => [{ voice_id: "v1", name: "Voice One", preview_url: "" }],
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ScriptList", () => {
  it("renders empty state when no scripts", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<ScriptList scripts={[]} onDelete={() => {}} />, {
      wrapper: wrap(qc),
    });
    expect(screen.getByText(/No scripts yet/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Create your first script/ }),
    ).toBeInTheDocument();
  });

  it("renders one card per script", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const scripts = [
      {
        id: 1,
        userId: "u",
        title: "First",
        content: "a",
        audioUrl: null,
        audioSource: null,
        voiceId: "v1",
        loopGapSeconds: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        userId: "u",
        title: "Second",
        content: "b",
        audioUrl: null,
        audioSource: null,
        voiceId: null,
        loopGapSeconds: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    render(<ScriptList scripts={scripts} onDelete={() => {}} />, {
      wrapper: wrap(qc),
    });
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("No voice")).toBeInTheDocument();
  });

  it("invokes onDelete with id+title after the AlertDialog Delete is confirmed", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const onDelete = vi.fn();
    render(
      <ScriptList
        scripts={[
          {
            id: 7,
            userId: "u",
            title: "Removable",
            content: "c",
            audioUrl: null,
            audioSource: null,
            voiceId: "v1",
            loopGapSeconds: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]}
        onDelete={onDelete}
      />,
      { wrapper: wrap(qc) },
    );

    fireEvent.click(screen.getByRole("button", { name: /Delete Removable/ }));
    const confirm = await screen.findByRole("button", { name: /^Delete$/ });
    fireEvent.click(confirm);
    expect(onDelete).toHaveBeenCalledWith(7, "Removable");
  });
});
