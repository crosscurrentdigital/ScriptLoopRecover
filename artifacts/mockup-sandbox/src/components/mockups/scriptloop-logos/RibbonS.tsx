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
    {/* Teal back-S — tighter reverse curvature, hugs near the front S */}
    <path
      d="M 22,46 C 24,32 40,32 42,18"
      stroke={secondary}
      strokeWidth="8"
    />
    {/* Violet S — skinny, normal stroke */}
    <path
      d="M 42,18 C 42,8 30,8 26,16 C 20,28 32,30 32,32 C 32,34 44,36 38,48 C 34,56 22,56 22,46"
      stroke={primary}
      strokeWidth="8"
    />
  </svg>
);

export function RibbonS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation A — Tight Möbius S. Skinny S with a tight reverse-S back-arc that hugs the front face — most compact read of the twist."
    />
  );
}
