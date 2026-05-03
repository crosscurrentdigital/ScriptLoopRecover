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
    {/* Teal back-S — reversed curvature, mirror of the front S */}
    <path
      d="M 22,46 C 22,32 42,32 42,18"
      stroke={secondary}
      strokeWidth="8"
    />
    {/* Violet front S — skinnier (narrower left-to-right) */}
    <path
      d="M 42,18 C 42,8 30,8 26,16 C 20,28 32,30 32,32 C 32,34 44,36 38,48 C 34,56 22,56 22,46"
      stroke={primary}
      strokeWidth="8"
    />
  </svg>
);

export function LoopMark() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Concept 1 — Möbius S. Skinnier proportions; the teal back-S mirrors the front S's curvature, completing a flat Möbius loop."
    />
  );
}
