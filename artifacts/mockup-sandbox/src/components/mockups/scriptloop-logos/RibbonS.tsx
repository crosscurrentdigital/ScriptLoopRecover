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
    {/* Teal back-of-ribbon stripe — diagonal, suggests a 3D twist */}
    <path d="M 12,22 L 52,42" stroke={secondary} strokeWidth="8" />
    {/* Bold violet S */}
    <path
      d="M 52,18 C 52,8 28,8 20,16 C 8,28 32,30 32,32 C 32,34 56,36 44,48 C 36,56 12,56 12,46"
      stroke={primary}
      strokeWidth="10"
    />
  </svg>
);

export function RibbonS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation B (refined) — Twisted Ribbon S. A bold S with a teal stripe angling behind the center, the back face of the Möbius twist showing through."
    />
  );
}
