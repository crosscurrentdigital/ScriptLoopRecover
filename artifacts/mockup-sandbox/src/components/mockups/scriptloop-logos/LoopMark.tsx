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
    {/* Teal back-of-ribbon stripe — drawn FIRST so it sits behind the S */}
    <path d="M 10,32 L 54,32" stroke={secondary} strokeWidth="7" />
    {/* Violet S — elegant medium weight, hides middle of teal stripe */}
    <path
      d="M 52,18 C 52,10 32,8 22,16 C 10,26 32,30 32,32 C 32,34 54,38 42,48 C 32,56 12,54 12,46"
      stroke={primary}
      strokeWidth="8"
    />
  </svg>
);

export function LoopMark() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Concept 1 (refined) — Möbius S. An elegant script S with a teal connection line passing behind the center, suggesting the back face of a twisted ribbon."
    />
  );
}
