import React from "react";
import { LogoTile, MarkProps } from "./_LogoTile";

const Mark: React.FC<MarkProps> = ({
  primary = "currentColor",
  secondary = "#2DD4BF",
  className = "",
}) => (
  <svg
    className={className}
    viewBox="0 0 64 40"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="5"
  >
    <g transform="rotate(-22 32 20)">
      <path
        d="M 32,20 C 32,32 8,32 8,20 C 8,8 32,8 32,20 Z"
        stroke={primary}
      />
      <path
        d="M 32,20 C 32,8 56,8 56,20 C 56,32 32,32 32,20 Z"
        stroke={secondary}
      />
    </g>
  </svg>
);

export function TiltedS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation D — Tilted Lemniscate. The two-tone infinity rotated -22° so the whole shape leans into an italic-S posture while keeping the woven crossing."
    />
  );
}
