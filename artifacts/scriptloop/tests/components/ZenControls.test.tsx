import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/components/ui/select", () => {
  const React = require("react");
  type SelectProps = {
    value?: string;
    onValueChange?: (v: string) => void;
    children?: React.ReactNode;
  };
  const Ctx = React.createContext({});
  return {
    Select: ({ value, onValueChange, children }: SelectProps) => (
      <Ctx.Provider value={{ onValueChange }}>
        <div data-testid="select-root" data-value={value}>
          {children}
        </div>
      </Ctx.Provider>
    ),
    SelectTrigger: ({
      children,
      "aria-label": ariaLabel,
    }: {
      children?: React.ReactNode;
      "aria-label"?: string;
    }) => (
      <button type="button" role="combobox" aria-label={ariaLabel}>
        {children}
      </button>
    ),
    SelectValue: () => null,
    SelectContent: ({ children }: { children?: React.ReactNode }) => (
      <div role="listbox">{children}</div>
    ),
    SelectItem: ({
      value,
      children,
    }: {
      value: string;
      children?: React.ReactNode;
    }) => {
      const ctx = React.useContext(Ctx);
      return (
        <button
          type="button"
          role="option"
          aria-selected={false}
          onClick={() => ctx.onValueChange?.(value)}
        >
          {children}
        </button>
      );
    },
  };
});

const { ZenControls } = await import("@/components/ZenControls");

afterEach(() => cleanup());

describe("ZenControls", () => {
  it("toolbar exit button calls onExit", () => {
    const onExit = vi.fn();
    render(
      <ZenControls
        isPlaying={false}
        onTogglePlay={() => {}}
        gapSeconds={2}
        onGapChange={() => {}}
        loopCount={0}
        onExit={onExit}
        visible
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Exit Zen Mode/ }));
    expect(onExit).toHaveBeenCalled();
  });

  it("play button toggles via callback when paused", () => {
    const onToggle = vi.fn();
    render(
      <ZenControls
        isPlaying={false}
        onTogglePlay={onToggle}
        gapSeconds={2}
        onGapChange={() => {}}
        loopCount={3}
        onExit={() => {}}
        visible
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(onToggle).toHaveBeenCalled();
  });

  it("renders pause when playing and shows loop count", () => {
    render(
      <ZenControls
        isPlaying
        onTogglePlay={() => {}}
        gapSeconds={2}
        onGapChange={() => {}}
        loopCount={7}
        onExit={() => {}}
        visible
      />,
    );
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("gap select fires onGapChange with the parsed numeric value", () => {
    const onGapChange = vi.fn();
    render(
      <ZenControls
        isPlaying={false}
        onTogglePlay={() => {}}
        gapSeconds={2}
        onGapChange={onGapChange}
        loopCount={0}
        onExit={() => {}}
        visible
      />,
    );
    fireEvent.click(screen.getByRole("option", { name: "5s" }));
    expect(onGapChange).toHaveBeenCalledWith(5);
    expect(typeof onGapChange.mock.calls[0]?.[0]).toBe("number");
  });

  it("toggles between Play and Pause aria-labels driven by isPlaying prop", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <ZenControls
        isPlaying={false}
        onTogglePlay={onToggle}
        gapSeconds={2}
        onGapChange={() => {}}
        loopCount={0}
        onExit={() => {}}
        visible
      />,
    );
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    rerender(
      <ZenControls
        isPlaying
        onTogglePlay={onToggle}
        gapSeconds={2}
        onGapChange={() => {}}
        loopCount={0}
        onExit={() => {}}
        visible
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides controls (aria-hidden, pointer-events-none) when visible=false", () => {
    render(
      <ZenControls
        isPlaying={false}
        onTogglePlay={() => {}}
        gapSeconds={2}
        onGapChange={() => {}}
        loopCount={0}
        onExit={() => {}}
        visible={false}
      />,
    );
    const toolbar = screen.getByRole("toolbar", { hidden: true });
    expect(toolbar).toHaveAttribute("aria-hidden", "true");
    expect(toolbar.className).toMatch(/pointer-events-none/);
  });
});
