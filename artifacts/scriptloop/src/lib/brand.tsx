import React from "react";

export const BRAND = {
  name: "ScriptLoop",
  tagline: "Memorize anything by listening to it on loop.",
  font: "Space Grotesk, Inter, system-ui, sans-serif",
  colors: {
    violet: "#4C1D95",
    violetLight: "#A78BFA",
    teal: "#0D9488",
    tealLight: "#2DD4BF",
    ink: "#0A0A0A",
    paper: "#FAFAFA",
  },
} as const;

export type BrandMarkProps = {
  primary?: string;
  secondary?: string;
  className?: string;
  strokeWidth?: number;
  title?: string;
};

/**
 * ScriptLoop brand mark — skinny violet S with teal reverse-S back-arc.
 * Default stroke 6 reads well from ~24px up. For favicon-scale rendering
 * (≤32px), bump strokeWidth to 8.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  primary = BRAND.colors.violet,
  secondary = BRAND.colors.teal,
  className = "",
  strokeWidth = 6,
  title,
}) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    role={title ? "img" : "presentation"}
    aria-label={title}
  >
    {title ? <title>{title}</title> : null}
    <path
      d="M 22,46 C 22,32 42,32 42,18"
      stroke={secondary}
      strokeWidth={strokeWidth}
    />
    <path
      d="M 42,18 C 42,8 30,8 26,16 C 20,28 32,30 32,32 C 32,34 44,36 38,48 C 34,56 22,56 22,46"
      stroke={primary}
      strokeWidth={strokeWidth}
    />
  </svg>
);
