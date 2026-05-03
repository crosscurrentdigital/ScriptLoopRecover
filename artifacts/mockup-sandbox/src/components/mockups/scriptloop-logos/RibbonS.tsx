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
    {/* Teal back-of-ribbon — slight curve so the back face has a 3D feel */}
    <path
      d="M 12,46 Q 22,38 42,26 T 52,18"
      stroke={secondary}
      strokeWidth="9"
    />
    {/* Bold violet S */}
    <path
      d="M 52,18 C 52,6 26,6 18,16 C 6,28 32,30 32,32 C 32,34 58,36 46,48 C 38,58 12,58 12,46"
      stroke={primary}
      strokeWidth="10"
    />
  </svg>
);

export function RibbonS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation B — Bold Möbius S. Heavier weight; the teal back-face curves slightly behind the center, suggesting the natural arc of a twisted ribbon."
    />
  );
}
