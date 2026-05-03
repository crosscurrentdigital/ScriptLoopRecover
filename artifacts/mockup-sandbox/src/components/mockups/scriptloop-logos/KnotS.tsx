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
    {/* Teal back-stripe — gentle arc, like the back of the ribbon curving around */}
    <path
      d="M 12,28 Q 32,40 52,28"
      stroke={secondary}
      strokeWidth="7"
    />
    {/* Violet S */}
    <path
      d="M 52,18 C 52,10 30,8 22,16 C 10,26 32,30 32,32 C 32,34 54,38 42,48 C 32,56 12,54 12,46"
      stroke={primary}
      strokeWidth="9"
    />
  </svg>
);

export function KnotS() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation D — Curved Back S. The teal connection line arcs gently behind the S center, hinting at the curvature of the ribbon's underside."
    />
  );
}
