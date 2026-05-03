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
    {/* Teal back-arc — wraps around the LEFT side, the mirror of variation C */}
    <path
      d="M 12,46 C 4,28 60,36 52,18"
      stroke={secondary}
      strokeWidth="7"
    />
    {/* Violet S */}
    <path
      d="M 52,18 C 52,8 28,8 20,16 C 8,28 32,30 32,32 C 32,34 56,36 44,48 C 36,56 12,56 12,46"
      stroke={primary}
      strokeWidth="8"
    />
  </svg>
);

export function KnotS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation D — Hooked Möbius S. The teal back arcs around the left side of the S to reconnect the tips — a softer enclosure of the loop."
    />
  );
}
