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
    strokeWidth="9"
  >
    <path
      d="M 46,14 C 26,14 18,28 32,32 C 46,36 38,50 18,50"
      stroke={primary}
    />
    <path
      d="M 46,14 C 26,14 18,28 32,32"
      stroke={secondary}
    />
  </svg>
);

export function RibbonS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation B — Twisted Ribbon S. A bold script S where the top half flips to teal at the center crossing — the Möbius twist as a color change."
    />
  );
}
