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
    {/* Teal back-stripe — short horizontal, only peeks out around the center crossing */}
    <path d="M 14,32 L 50,32" stroke={secondary} strokeWidth="9" />
    {/* Violet S — geometric, slightly chunkier */}
    <path
      d="M 50,16 C 50,10 30,8 22,14 C 12,22 30,30 32,32 C 34,34 52,40 44,50 C 36,58 14,56 14,48"
      stroke={primary}
      strokeWidth="11"
    />
  </svg>
);

export function VerticalMobius() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation C — Bold Möbius S. Heavy geometric S with a thick teal connection line passing behind the center — the most literal ribbon read."
    />
  );
}
