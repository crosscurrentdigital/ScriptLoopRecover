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
    <path
      d="M 22,46 C 22,32 42,32 42,18"
      stroke={secondary}
      strokeWidth="10"
    />
    <path
      d="M 42,18 C 42,8 30,8 26,16 C 20,28 32,30 32,32 C 32,34 44,36 38,48 C 34,56 22,56 22,46"
      stroke={primary}
      strokeWidth="10"
    />
  </svg>
);

export function TiltedS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation D — Bold. Concept 1's geometry at 10px stroke — heavier and more presence at small sizes."
    />
  );
}
