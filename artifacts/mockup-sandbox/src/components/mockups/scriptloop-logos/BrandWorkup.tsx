import React from "react";
import { BrandMark, BRAND } from "./_BrandMark";

const font = { fontFamily: BRAND.font };

function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
        dark ? "text-zinc-600" : "text-zinc-400"
      }`}
    >
      {children}
    </div>
  );
}

function Tile({
  label,
  dark = false,
  children,
  className = "",
}: {
  label: string;
  dark?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden border ${
        dark ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
      } ${className}`}
    >
      <div className="absolute top-3 left-3 z-10">
        <SectionLabel dark={dark}>{label}</SectionLabel>
      </div>
      <div className="w-full h-full flex items-center justify-center">{children}</div>
    </div>
  );
}

function HorizontalLockup({ dark = false, size = "lg" }: { dark?: boolean; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: { mark: "w-7 h-7", text: "text-lg", gap: "gap-2.5" },
                 md: { mark: "w-10 h-10", text: "text-2xl", gap: "gap-3" },
                 lg: { mark: "w-14 h-14", text: "text-4xl", gap: "gap-4" } }[size];
  return (
    <div className={`flex items-center ${dims.gap} ${dark ? "text-white" : "text-zinc-900"}`}>
      <BrandMark
        className={dims.mark}
        primary={dark ? BRAND.violetLight : BRAND.violet}
        secondary={dark ? BRAND.tealLight : BRAND.teal}
      />
      <span className={`${dims.text} font-bold tracking-tight`} style={font}>
        {BRAND.name}
      </span>
    </div>
  );
}

function StackedLockup({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${dark ? "text-white" : "text-zinc-900"}`}>
      <BrandMark
        className="w-16 h-16"
        primary={dark ? BRAND.violetLight : BRAND.violet}
        secondary={dark ? BRAND.tealLight : BRAND.teal}
      />
      <span className="text-3xl font-bold tracking-tight" style={font}>
        {BRAND.name}
      </span>
    </div>
  );
}

function TaglineLockup({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`flex items-center gap-5 ${dark ? "text-white" : "text-zinc-900"}`}>
      <BrandMark
        className="w-16 h-16"
        primary={dark ? BRAND.violetLight : BRAND.violet}
        secondary={dark ? BRAND.tealLight : BRAND.teal}
      />
      <div className="flex flex-col">
        <span className="text-3xl font-bold tracking-tight leading-none" style={font}>
          {BRAND.name}
        </span>
        <span
          className={`text-sm mt-1.5 tracking-wide ${dark ? "text-zinc-400" : "text-zinc-500"}`}
          style={font}
        >
          {BRAND.tagline}
        </span>
      </div>
    </div>
  );
}

function Swatch({
  name,
  hex,
  text = "white",
}: {
  name: string;
  hex: string;
  text?: "white" | "black";
}) {
  return (
    <div className="flex-1 rounded-xl overflow-hidden border border-zinc-200 flex flex-col">
      <div
        className={`flex-1 flex items-end p-4 ${text === "white" ? "text-white" : "text-zinc-900"}`}
        style={{ background: hex, minHeight: 110 }}
      >
        <div className="text-sm font-semibold tracking-tight" style={font}>
          {name}
        </div>
      </div>
      <div className="bg-white px-4 py-2 text-[11px] font-mono text-zinc-500 border-t border-zinc-100">
        {hex.toUpperCase()}
      </div>
    </div>
  );
}

export function BrandWorkup() {
  return (
    <div className="w-[1400px] bg-zinc-50 font-sans" style={font}>
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-200 px-12 py-8 flex items-center justify-between">
        <HorizontalLockup size="md" />
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Brand System
          </div>
          <div className="text-sm text-zinc-700 mt-1">Variation C — Reverse-S Möbius, 6px · v1.0</div>
        </div>
      </div>

      {/* HERO */}
      <div className="grid grid-cols-2 gap-0 border-b border-zinc-200">
        <div className="bg-white p-16 flex flex-col items-center justify-center gap-6 min-h-[360px] relative">
          <div className="absolute top-5 left-5">
            <SectionLabel>Primary mark · Light</SectionLabel>
          </div>
          <BrandMark className="w-48 h-48" primary={BRAND.violet} secondary={BRAND.teal} />
        </div>
        <div className="bg-zinc-950 p-16 flex flex-col items-center justify-center gap-6 min-h-[360px] relative">
          <div className="absolute top-5 left-5">
            <SectionLabel dark>Primary mark · Dark</SectionLabel>
          </div>
          <BrandMark
            className="w-48 h-48"
            primary={BRAND.violetLight}
            secondary={BRAND.tealLight}
          />
        </div>
      </div>

      {/* MARK LIBRARY */}
      <div className="px-12 py-10 border-b border-zinc-200">
        <SectionLabel>Mark library</SectionLabel>
        <div className="grid grid-cols-5 gap-4 mt-4">
          <Tile label="Full color" className="h-40">
            <BrandMark className="w-20 h-20" primary={BRAND.violet} secondary={BRAND.teal} />
          </Tile>
          <Tile label="Mono violet" className="h-40">
            <BrandMark className="w-20 h-20" primary={BRAND.violet} secondary={BRAND.violet} />
          </Tile>
          <Tile label="Mono teal" className="h-40">
            <BrandMark className="w-20 h-20" primary={BRAND.teal} secondary={BRAND.teal} />
          </Tile>
          <Tile label="Mono ink" className="h-40">
            <BrandMark className="w-20 h-20" primary={BRAND.ink} secondary={BRAND.ink} />
          </Tile>
          <Tile label="Mono white" dark className="h-40">
            <BrandMark className="w-20 h-20" primary="#ffffff" secondary="#ffffff" />
          </Tile>
        </div>
      </div>

      {/* WORDMARK + LOCKUPS */}
      <div className="px-12 py-10 border-b border-zinc-200">
        <SectionLabel>Wordmark &amp; lockups</SectionLabel>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Tile label="Wordmark · Light" className="h-32">
            <span className="text-5xl font-bold tracking-tight text-zinc-900" style={font}>
              ScriptLoop
            </span>
          </Tile>
          <Tile label="Wordmark · Dark" dark className="h-32">
            <span className="text-5xl font-bold tracking-tight text-white" style={font}>
              ScriptLoop
            </span>
          </Tile>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Tile label="Horizontal lockup · Light" className="h-32">
            <HorizontalLockup size="lg" />
          </Tile>
          <Tile label="Horizontal lockup · Dark" dark className="h-32">
            <HorizontalLockup size="lg" dark />
          </Tile>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Tile label="Stacked lockup · Light" className="h-44">
            <StackedLockup />
          </Tile>
          <Tile label="Stacked lockup · Dark" dark className="h-44">
            <StackedLockup dark />
          </Tile>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Tile label="With tagline · Light" className="h-36">
            <TaglineLockup />
          </Tile>
          <Tile label="With tagline · Dark" dark className="h-36">
            <TaglineLockup dark />
          </Tile>
        </div>
      </div>

      {/* APP ICONS */}
      <div className="px-12 py-10 border-b border-zinc-200">
        <SectionLabel>Icons &amp; avatars</SectionLabel>
        <div className="grid grid-cols-6 gap-4 mt-4 items-end">
          {/* App icon - violet gradient */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-32 h-32 rounded-3xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${BRAND.violet} 0%, #6D28D9 50%, ${BRAND.teal} 100%)`,
              }}
            >
              <BrandMark className="w-20 h-20" primary="#ffffff" secondary={BRAND.tealLight} />
            </div>
            <div className="text-[11px] text-zinc-500">App icon · 128</div>
          </div>

          {/* App icon - dark */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 rounded-3xl bg-zinc-950 flex items-center justify-center shadow-lg">
              <BrandMark
                className="w-20 h-20"
                primary={BRAND.violetLight}
                secondary={BRAND.tealLight}
              />
            </div>
            <div className="text-[11px] text-zinc-500">App icon · dark</div>
          </div>

          {/* App icon - paper */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 rounded-3xl bg-white border border-zinc-200 flex items-center justify-center shadow-lg">
              <BrandMark className="w-20 h-20" primary={BRAND.violet} secondary={BRAND.teal} />
            </div>
            <div className="text-[11px] text-zinc-500">App icon · paper</div>
          </div>

          {/* Avatar circle violet */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-md"
              style={{ background: BRAND.violet }}
            >
              <BrandMark className="w-16 h-16" primary="#ffffff" secondary={BRAND.tealLight} />
            </div>
            <div className="text-[11px] text-zinc-500">Avatar · 96</div>
          </div>

          {/* Favicon */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center shadow-sm"
              style={{ background: BRAND.violet }}
            >
              <BrandMark className="w-10 h-10" primary="#ffffff" secondary={BRAND.tealLight} />
            </div>
            <div className="text-[11px] text-zinc-500">Favicon · 64</div>
          </div>

          {/* Tiny favicon */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ background: BRAND.violet }}
            >
              <BrandMark className="w-5 h-5" primary="#ffffff" secondary={BRAND.tealLight} />
            </div>
            <div className="text-[11px] text-zinc-500">Favicon · 32</div>
          </div>
        </div>
      </div>

      {/* COLOR PALETTE */}
      <div className="px-12 py-10 border-b border-zinc-200">
        <SectionLabel>Color palette</SectionLabel>
        <div className="flex gap-4 mt-4">
          <Swatch name="Violet 900" hex={BRAND.violet} />
          <Swatch name="Violet 400" hex={BRAND.violetLight} text="black" />
          <Swatch name="Teal 700" hex={BRAND.teal} />
          <Swatch name="Teal 400" hex={BRAND.tealLight} text="black" />
          <Swatch name="Ink" hex={BRAND.ink} />
          <Swatch name="Paper" hex={BRAND.paper} text="black" />
        </div>
      </div>

      {/* TYPOGRAPHY */}
      <div className="px-12 py-10 border-b border-zinc-200">
        <SectionLabel>Typography · Space Grotesk</SectionLabel>
        <div className="mt-4 grid grid-cols-3 gap-6 items-end">
          <div>
            <div className="text-[11px] text-zinc-400 mb-2">Display · 700</div>
            <div className="text-6xl font-bold tracking-tight text-zinc-900" style={font}>
              Aa
            </div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 mb-2">Headline · 600</div>
            <div className="text-3xl font-semibold text-zinc-900" style={font}>
              Loops that ship.
            </div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 mb-2">Body · 400</div>
            <div className="text-base text-zinc-700 leading-relaxed" style={font}>
              ScriptLoop turns recurring scripts into shipped product loops — every commit closes a
              twist.
            </div>
          </div>
        </div>
      </div>

      {/* IN-CONTEXT */}
      <div className="px-12 py-10">
        <SectionLabel>In context</SectionLabel>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Browser chrome */}
          <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm bg-white">
            <div className="bg-zinc-100 border-b border-zinc-200 flex items-center px-3 py-2 gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <div className="flex-1 mx-3 bg-white border border-zinc-200 rounded-md px-3 py-1 text-[11px] text-zinc-500 flex items-center gap-2">
                <BrandMark className="w-3 h-3" primary={BRAND.violet} secondary={BRAND.teal} />
                <span>scriptloop.app</span>
              </div>
            </div>
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
              <HorizontalLockup size="sm" />
              <div className="flex gap-5 text-xs text-zinc-600 font-medium">
                <span>Product</span>
                <span>Docs</span>
                <span>Pricing</span>
                <span
                  className="px-3 py-1.5 rounded-md text-white"
                  style={{ background: BRAND.violet }}
                >
                  Sign in
                </span>
              </div>
            </div>
            <div className="px-6 py-8">
              <div className="text-3xl font-bold tracking-tight text-zinc-900" style={font}>
                Loops that ship.
              </div>
              <div className="text-sm text-zinc-500 mt-2">Marketing site header preview</div>
            </div>
          </div>

          {/* Business card */}
          <div className="grid grid-rows-2 gap-3">
            <div
              className="rounded-xl shadow-md p-6 flex flex-col justify-between text-white"
              style={{
                background: `linear-gradient(135deg, ${BRAND.violet} 0%, #312E81 100%)`,
              }}
            >
              <BrandMark
                className="w-10 h-10"
                primary="#ffffff"
                secondary={BRAND.tealLight}
              />
              <div>
                <div className="text-lg font-bold tracking-tight" style={font}>
                  ScriptLoop
                </div>
                <div className="text-xs text-violet-200 mt-0.5" style={font}>
                  {BRAND.tagline}
                </div>
              </div>
            </div>
            <div className="rounded-xl shadow-md bg-white border border-zinc-200 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-zinc-900" style={font}>
                    Sam Rivera
                  </div>
                  <div className="text-xs text-zinc-500" style={font}>
                    Founding engineer
                  </div>
                </div>
                <BrandMark
                  className="w-10 h-10"
                  primary={BRAND.violet}
                  secondary={BRAND.teal}
                />
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">sam@scriptloop.app</div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-zinc-950 px-12 py-8 flex items-center justify-between">
        <HorizontalLockup size="sm" dark />
        <div className="text-[11px] text-zinc-500 tracking-wider uppercase">
          ScriptLoop · Brand System
        </div>
      </div>
    </div>
  );
}
