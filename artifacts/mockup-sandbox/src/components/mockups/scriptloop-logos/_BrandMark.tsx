import React from "react";

export type BrandMarkProps = {
  primary?: string;
  secondary?: string;
  className?: string;
};

export const BrandMark: React.FC<BrandMarkProps> = ({
  primary = "currentColor",
  secondary = "#0D9488",
  className = "",
}) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Teal back-arc — swings around the right side to reconnect the S tips */}
    <path
      d="M 22,46 C 38,55 55,38 42,18"
      stroke={secondary}
      strokeWidth="8"
    />
    {/* Violet skinny S */}
    <path
      d="M 42,18 C 42,8 30,8 26,16 C 20,28 32,30 32,32 C 32,34 44,36 38,48 C 34,56 22,56 22,46"
      stroke={primary}
      strokeWidth="9"
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
