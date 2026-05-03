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
    {/* Teal back-arc — swings around the right side to reconnect tips */}
    <path
      d="M 22,46 C 38,55 55,38 42,18"
      stroke={secondary}
      strokeWidth="8"
    />
    {/* Violet S — skinnier */}
    <path
      d="M 42,18 C 42,8 30,8 26,16 C 20,28 32,30 32,32 C 32,34 44,36 38,48 C 34,56 22,56 22,46"
      stroke={primary}
      strokeWidth="9"
    />
  </svg>
);

export function VerticalMobius() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation C — Wrapped Möbius S. Skinnier S with the teal back-arc swinging around the right side to enclose the loop."
    />
  );
}
