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
    <g transform="rotate(-8 32 32)">
      {/* Teal straight back-line connecting S tips through center */}
      <path d="M 12,46 L 52,18" stroke={secondary} strokeWidth="8" />
      {/* Violet S, italicized */}
      <path
        d="M 52,18 C 52,8 28,8 20,16 C 8,28 32,30 32,32 C 32,34 56,36 44,48 C 36,56 12,56 12,46"
        stroke={primary}
        strokeWidth="9"
      />
    </g>
  </svg>
);

export function TiltedS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation E — Italic Möbius S. Same closed-loop construction, italicized for an editorial feel."
    />
  );
}
