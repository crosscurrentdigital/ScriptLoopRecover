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
    {/* Hairline teal back-arc as a delicate accent behind a bold violet S */}
    <path
      d="M 22,46 C 22,32 42,32 42,18"
      stroke={secondary}
      strokeWidth="4"
    />
    <path
      d="M 42,18 C 42,8 30,8 26,16 C 20,28 32,30 32,32 C 32,34 44,36 38,48 C 34,56 22,56 22,46"
      stroke={primary}
      strokeWidth="9"
    />
  </svg>
);

export function SlimS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation E — Mixed weights. Bold 9px violet S with a hairline 4px teal back-arc — the twist becomes a delicate accent."
    />
  );
}
