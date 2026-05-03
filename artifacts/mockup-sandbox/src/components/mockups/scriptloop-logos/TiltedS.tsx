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
    {/* Italic-leaning teal back-stripe */}
    <path d="M 10,38 L 50,26" stroke={secondary} strokeWidth="8" />
    {/* Italic-leaning violet S — slight rightward slant */}
    <g transform="rotate(-8 32 32)">
      <path
        d="M 52,18 C 52,10 30,8 22,16 C 10,26 32,30 32,32 C 32,34 54,38 42,48 C 32,56 12,54 12,46"
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
      caption="Variation E — Italic Möbius S. An italicized S with a teal stripe angling behind the center — feels dynamic and editorial."
    />
  );
}
