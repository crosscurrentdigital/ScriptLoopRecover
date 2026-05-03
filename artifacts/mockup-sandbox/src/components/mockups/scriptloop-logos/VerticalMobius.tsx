import React from "react";
import { LogoTile, MarkProps } from "./_LogoTile";

const Mark: React.FC<MarkProps> = ({
  primary = "currentColor",
  secondary = "#2DD4BF",
  className = "",
}) => (
  <svg
    className={className}
    viewBox="0 0 40 64"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="5"
  >
    <path
      d="M 20,32 C 8,32 8,8 20,8 C 32,8 32,32 20,32 Z"
      stroke={primary}
    />
    <path
      d="M 20,32 C 8,32 8,56 20,56 C 32,56 32,32 20,32 Z"
      stroke={secondary}
    />
  </svg>
);

export function VerticalMobius() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation A — Vertical Möbius. The two-tone infinity stood on end so it reads top-to-bottom as a stacked figure-8 / S."
    />
  );
}
