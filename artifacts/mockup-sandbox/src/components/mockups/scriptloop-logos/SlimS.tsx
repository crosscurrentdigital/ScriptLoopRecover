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
    {/* Teal back-S — wider reverse-S bulge, thin */}
    <path
      d="M 22,46 C 14,32 50,32 42,18"
      stroke={secondary}
      strokeWidth="4"
    />
    {/* Violet S — skinny, THIN stroke */}
    <path
      d="M 42,18 C 42,8 30,8 26,16 C 20,28 32,30 32,32 C 32,34 44,36 38,48 C 34,56 22,56 22,46"
      stroke={primary}
      strokeWidth="4"
    />
  </svg>
);

export function SlimS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation E — Refined Wide Möbius S. The same wider construction as B but with a much thinner stroke — sophisticated and airy."
    />
  );
}
