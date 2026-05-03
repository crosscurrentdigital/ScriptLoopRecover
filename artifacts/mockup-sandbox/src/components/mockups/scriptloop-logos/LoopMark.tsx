import React from "react";
import { LogoTile, MarkProps } from "./_LogoTile";

const Mark: React.FC<MarkProps> = ({
  primary = "currentColor",
  secondary = "#2DD4BF",
  className = "",
}) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Teal "back of ribbon" — connects the bottom-left tip of S to the top-right tip,
        passing BEHIND the S center. Together they form a single closed Möbius loop. */}
    <path
      d="M 12,46 C 12,32 52,32 52,18"
      stroke={secondary}
      strokeWidth="8"
    />
    {/* Violet S — front face of the ribbon. Endpoints (52,18) and (12,46) match the teal. */}
    <path
      d="M 52,18 C 52,8 28,8 20,16 C 8,28 32,30 32,32 C 32,34 56,36 44,48 C 36,56 12,56 12,46"
      stroke={primary}
      strokeWidth="8"
    />
  </svg>
);

export function LoopMark() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Concept 1 — Möbius S. The teal back-of-ribbon connects the two tips of the S, passing behind the center. Together they form a single closed loop with one twist — a true Möbius strip."
    />
  );
}
