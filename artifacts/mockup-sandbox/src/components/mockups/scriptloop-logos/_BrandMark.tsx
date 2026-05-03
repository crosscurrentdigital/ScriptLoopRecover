import React from "react";

export type BrandMarkProps = {
  primary?: string;
  secondary?: string;
  className?: string;
  strokeWidth?: number;
};

export const BrandMark: React.FC<BrandMarkProps> = ({
  primary = "currentColor",
  secondary = "#0D9488",
  className = "",
  strokeWidth = 6,
}) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Teal back-S — reversed curvature, mirror of the front S */}
    <path
      d="M 22,46 C 22,32 42,32 42,18"
      stroke={secondary}
      strokeWidth={strokeWidth}
    />
    {/* Violet skinny S */}
    <path
      d="M 42,18 C 42,8 30,8 26,16 C 20,28 32,30 32,32 C 32,34 44,36 38,48 C 34,56 22,56 22,46"
      stroke={primary}
      strokeWidth={strokeWidth}
    />
  </svg>
);

export const BRAND = {
  name: "ScriptLoop",
  tagline: "Scripts that ship in a loop.",
  font: "Space Grotesk",
  violet: "#4C1D95",
  violetLight: "#A78BFA",
  teal: "#0D9488",
  tealLight: "#2DD4BF",
  ink: "#0A0A0A",
  paper: "#FAFAFA",
};
