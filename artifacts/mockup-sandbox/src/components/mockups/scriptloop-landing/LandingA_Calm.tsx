import React from "react";
import { Mic2, EyeOff, Sparkles } from "lucide-react";
import { BRAND, Mark, Lockup, Caption } from "./_shared";

const font = { fontFamily: BRAND.font };

export function LandingA_Calm() {
  return (
    <div className="w-[1280px] bg-white" style={font}>
      {/* HEADER */}
      <header className="border-b border-zinc-100 px-12 py-5 flex items-center justify-between">
        <Lockup />
        <nav className="flex items-center gap-7 text-sm text-zinc-600 font-medium">
          <span>How it works</span>
          <span>Voices</span>
          <span>Pricing</span>
          <button
            className="px-4 py-2 rounded-md text-white text-sm font-semibold"
            style={{ background: BRAND.violet }}
          >
            Sign in
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section className="px-12 pt-24 pb-20 text-center">
        <div className="flex justify-center mb-8">
          <Mark className="h-24 w-24" />
        </div>
        <p
          className="text-xs font-semibold uppercase tracking-[0.3em] mb-5"
          style={{ color: BRAND.violet }}
        >
          {BRAND.name}
        </p>
        <h1
          className="text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto text-zinc-900"
          style={font}
        >
          Memorize anything
          <br />
          by listening on{" "}
          <span style={{ color: BRAND.violet }}>loop.</span>
        </h1>
        <p className="mt-8 text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          Paste any text. Generate a voice. Loop until it lives in your head.
        </p>
        <div className="mt-12 flex items-center justify-center gap-3">
          <button
            className="px-7 py-3.5 rounded-lg text-white text-base font-semibold shadow-sm hover:opacity-90"
            style={{ background: BRAND.violet }}
          >
            Start memorizing — free
          </button>
          <button className="px-7 py-3.5 rounded-lg text-zinc-700 text-base font-semibold border border-zinc-200 hover:bg-zinc-50">
            Hear a sample →
          </button>
        </div>
        <p className="mt-5 text-xs text-zinc-400">
          Free forever for the first 10 minutes of audio · No credit card
        </p>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <section className="px-12 py-10 border-y border-zinc-100 bg-zinc-50/50">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-zinc-400 mb-6">
          Loved by students, actors, founders &amp; speakers
        </p>
        <div className="flex items-center justify-center gap-12 text-zinc-300 text-2xl font-bold tracking-tight">
          <span>Stanford</span>
          <span>·</span>
          <span>RADA</span>
          <span>·</span>
          <span>YC W25</span>
          <span>·</span>
          <span>TEDx</span>
          <span>·</span>
          <span>Berklee</span>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-12 py-24">
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold uppercase tracking-[0.25em] mb-3"
            style={{ color: BRAND.teal }}
          >
            How it works
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
            Three steps to a script that lives in your head.
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              icon: Mic2,
              n: "01",
              title: "Pick a voice",
              body:
                "Choose from a library of natural-sounding AI voices and turn any text into clean spoken audio.",
            },
            {
              icon: EyeOff,
              n: "02",
              title: "Hide as you learn",
              body:
                "Words progressively fade out so your memory does the heavy lifting — not your eyes.",
            },
            {
              icon: Sparkles,
              n: "03",
              title: "Loop in Zen Mode",
              body:
                "A distraction-free, full-screen practice space — just you, the voice, and the loop.",
            },
          ].map(({ icon: Icon, n, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-200 p-7 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-5">
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{
                    background: `${BRAND.violet}14`,
                    color: BRAND.violet,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className="text-xs font-mono"
                  style={{ color: BRAND.teal }}
                >
                  {n}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="mx-12 mb-20 rounded-3xl p-16 text-center text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${BRAND.violet} 0%, ${BRAND.violetMid} 60%, ${BRAND.teal} 100%)`,
        }}
      >
        <Mark
          className="h-20 w-20 mx-auto mb-6 opacity-90"
          primary="#FFFFFF"
          secondary={BRAND.tealLight}
        />
        <h2 className="text-4xl font-bold tracking-tight mb-3">
          Stop re-reading. Start looping.
        </h2>
        <p className="text-violet-100 text-lg mb-8 max-w-xl mx-auto">
          Your next monologue, pitch, or exam — already in your head by tonight.
        </p>
        <button
          className="px-7 py-3.5 rounded-lg bg-white text-base font-semibold shadow-md hover:opacity-90"
          style={{ color: BRAND.violet }}
        >
          Start free
        </button>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-100 px-12 py-8 flex items-center justify-between text-sm text-zinc-500">
        <Lockup size="sm" />
        <span>© 2026 ScriptLoop · Privacy · Terms</span>
      </footer>

      <Caption>
        Direction A — Calm &amp; trustworthy. Centered hero, lots of white
        space, soft violet accents, social-proof strip, gradient CTA band.
      </Caption>
    </div>
  );
}
