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
    strokeWidth="5"
  >
    <path
      d="M 44,20 C 28,20 22,30 32,34 C 42,38 38,46 22,46"
      stroke={primary}
    />
    <path
      d="M 44,20 C 56,12 58,24 50,26 C 44,27 42,22 44,20 Z"
      stroke={secondary}
      strokeWidth="4"
    />
    <path
      d="M 22,46 C 10,54 8,42 16,40 C 22,39 24,44 22,46 Z"
      stroke={secondary}
      strokeWidth="4"
    />
  </svg>
);

export function KnotS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation C — Calligraphic Knot S. A flowing S with teal flourish loops at each tip — the endpoints curl back, closing the form into an infinity knot."
    />
  );
}
