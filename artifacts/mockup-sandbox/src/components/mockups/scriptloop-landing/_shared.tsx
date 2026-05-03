import React from "react";

export const BRAND = {
  name: "ScriptLoop",
  tagline: "Memorize anything by listening to it on loop.",
  sub: "Paste any text. Generate a voice. Loop until it lives in your head.",
  font: "Space Grotesk, system-ui, sans-serif",
  violet: "#4C1D95",
  violetLight: "#A78BFA",
  violetMid: "#6D28D9",
  teal: "#0D9488",
  tealLight: "#2DD4BF",
  ink: "#0A0A0A",
  paper: "#FAFAFA",
};

export const Mark: React.FC<{
  className?: string;
  primary?: string;
  secondary?: string;
  strokeWidth?: number;
}> = ({
  className = "",
  primary = BRAND.violet,
  secondary = BRAND.teal,
  strokeWidth = 6,
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
      strokeWidth={strokeWidth}
    />
    <path
      d="M 42,18 C 42,8 30,8 26,16 C 20,28 32,30 32,32 C 32,34 44,36 38,48 C 34,56 22,56 22,46"
      stroke={primary}
      strokeWidth={strokeWidth}
    />
  </svg>
);

export const Lockup: React.FC<{
  size?: "sm" | "md";
  dark?: boolean;
  className?: string;
}> = ({ size = "sm", dark = false, className = "" }) => {
  const dims =
    size === "md"
      ? { mark: "h-9 w-9", text: "text-2xl" }
      : { mark: "h-7 w-7", text: "text-xl" };
  return (
    <div
      className={`inline-flex items-center gap-2 ${
        dark ? "text-white" : "text-zinc-900"
      } ${className}`}
    >
      <Mark
        className={dims.mark}
        primary={dark ? BRAND.violetLight : BRAND.violet}
        secondary={dark ? BRAND.tealLight : BRAND.teal}
      />
      <span
        className={`${dims.text} font-bold tracking-tight`}
        style={{ fontFamily: BRAND.font }}
      >
        {BRAND.name}
      </span>
    </div>
  );
};

export const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white border-t border-zinc-200 px-6 py-3 text-[13px] italic text-zinc-600">
    {children}
  </div>
);
