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
    {/* Teal back-arc — bulges around the OUTSIDE (right of S center), like the back
        of a ribbon swooping behind to reconnect — clearer Möbius geometry */}
    <path
      d="M 12,46 C 30,52 60,38 52,18"
      stroke={secondary}
      strokeWidth="8"
    />
    {/* Violet S */}
    <path
      d="M 52,18 C 52,8 28,8 20,16 C 8,28 32,30 32,32 C 32,34 56,36 44,48 C 36,56 12,56 12,46"
      stroke={primary}
      strokeWidth="9"
    />
  </svg>
);

export function VerticalMobius() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation C — Wrapped Möbius S. The teal back-arc swings around the right side of the S to reconnect the tips — emphasizes the closed loop."
    />
  );
}
