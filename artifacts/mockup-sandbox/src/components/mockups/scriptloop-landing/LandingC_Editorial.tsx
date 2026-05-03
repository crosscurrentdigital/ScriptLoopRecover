import React from "react";
import { BRAND, Mark, Lockup, Caption } from "./_shared";

const font = { fontFamily: BRAND.font };

export function LandingC_Editorial() {
  return (
    <div className="w-[1280px]" style={{ ...font, background: BRAND.paper }}>
      {/* HEADER */}
      <header className="px-12 py-6 flex items-center justify-between border-b border-zinc-200">
        <Lockup />
        <div className="flex items-center gap-8 text-sm text-zinc-700 font-medium">
          <span>Method</span>
          <span>Voices</span>
          <span>Pricing</span>
          <button
            className="px-4 py-2 rounded-full text-white text-sm font-semibold"
            style={{ background: BRAND.ink }}
          >
            Get started
          </button>
        </div>
      </header>

      {/* HERO — asymmetric, magazine-style */}
      <section className="relative px-12 pt-20 pb-24 overflow-hidden">
        {/* GIANT BACKGROUND MARK */}
        <div className="absolute -top-12 -right-32 opacity-[0.07] pointer-events-none">
          <Mark
            className="h-[700px] w-[700px]"
            primary={BRAND.violet}
            secondary={BRAND.teal}
            strokeWidth={5}
          />
        </div>

        <div className="relative grid grid-cols-12 gap-6">
          {/* Left rail: meta */}
          <div className="col-span-3 pt-2">
            <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">
              Issue №01
            </div>
            <div
              className="mt-2 text-sm font-medium"
              style={{ color: BRAND.violet }}
            >
              The looping method
            </div>
            <div className="mt-8 h-px w-12 bg-zinc-300" />
            <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
              A new way to memorize lines, lectures, and pitches — built around
              how your brain actually consolidates language.
            </p>
          </div>

          {/* Center: huge headline */}
          <div className="col-span-9">
            <h1
              className="text-[120px] font-bold tracking-[-0.04em] leading-[0.92] text-zinc-900"
              style={font}
            >
              Memorize
              <br />
              <span style={{ color: BRAND.violet }}>anything</span>
              <br />
              on{" "}
              <span className="relative inline-block">
                <span style={{ color: BRAND.teal }}>loop.</span>
                <span
                  className="absolute -bottom-1 left-0 right-0 h-2 rounded-full"
                  style={{ background: `${BRAND.tealLight}55` }}
                />
              </span>
            </h1>
            <div className="mt-12 grid grid-cols-12 gap-6 items-end">
              <p className="col-span-7 text-lg text-zinc-700 leading-relaxed border-l-2 pl-5"
                style={{ borderColor: BRAND.violet }}
              >
                Paste any text. Generate a voice. Loop until it lives in your
                head. No flashcards. No notes. Just sound and recall.
              </p>
              <div className="col-span-5 flex flex-col gap-3 items-start">
                <button
                  className="px-7 py-3.5 rounded-full text-white text-base font-semibold shadow-sm hover:opacity-90"
                  style={{ background: BRAND.violet }}
                >
                  Begin · 60-second setup
                </button>
                <span className="text-xs text-zinc-500 ml-2">
                  Free · No credit card
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PULL QUOTE BAND */}
      <section
        className="px-12 py-20 border-y border-zinc-200"
        style={{ background: BRAND.ink, color: BRAND.paper }}
      >
        <div className="grid grid-cols-12 gap-6 items-center">
          <div className="col-span-2">
            <Mark
              className="h-12 w-12"
              primary={BRAND.violetLight}
              secondary={BRAND.tealLight}
            />
          </div>
          <div className="col-span-10">
            <p
              className="text-4xl font-bold tracking-tight leading-tight"
              style={font}
            >
              "I learned a 4-page monologue overnight. I literally heard it in
              my dreams."
            </p>
            <p className="mt-4 text-sm text-zinc-400">
              — Maya R., theatre student · RADA · Class of 2026
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES — three columns, magazine layout */}
      <section className="px-12 py-24">
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-3">
            <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">
              Method
            </div>
            <div
              className="text-sm font-medium mt-1"
              style={{ color: BRAND.violet }}
            >
              Three movements
            </div>
          </div>
          <div className="col-span-9">
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
              Listen. Hide. Loop.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-zinc-200">
          {[
            {
              n: "I.",
              title: "Listen",
              body:
                "Choose a natural-sounding voice. Your text becomes audio you can play anywhere.",
              hue: BRAND.violet,
            },
            {
              n: "II.",
              title: "Hide",
              body:
                "Words fade out as you progress. The page becomes a test, not a script.",
              hue: BRAND.teal,
            },
            {
              n: "III.",
              title: "Loop",
              body:
                "Zen Mode loops the audio in the background. The lines settle in.",
              hue: BRAND.violetMid,
            },
          ].map(({ n, title, body, hue }) => (
            <div key={title} className="bg-white p-10">
              <div
                className="text-5xl font-bold mb-6"
                style={{ color: hue, fontFamily: BRAND.font }}
              >
                {n}
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 mb-3">
                {title}
              </h3>
              <p className="text-base text-zinc-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="px-12 pb-24">
        <div className="grid grid-cols-12 gap-6 items-center">
          <div className="col-span-7">
            <h2 className="text-5xl font-bold tracking-tight text-zinc-900">
              Your next pitch.
              <br />
              Your next monologue.
              <br />
              <span style={{ color: BRAND.violet }}>In your head by Friday.</span>
            </h2>
          </div>
          <div className="col-span-5 flex flex-col items-end gap-3">
            <button
              className="px-9 py-4 rounded-full text-white text-lg font-semibold shadow-md hover:opacity-90"
              style={{ background: BRAND.violet }}
            >
              Start memorizing — free
            </button>
            <span className="text-xs text-zinc-500">
              First 10 minutes of audio on us.
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 px-12 py-8 flex items-center justify-between text-sm text-zinc-500">
        <Lockup size="sm" />
        <span>Issue №01 · 2026 · ScriptLoop · Privacy · Terms</span>
      </footer>

      <Caption>
        Direction C — Editorial &amp; bold. Magazine layout, oversized type,
        the mark used as a giant background pattern, pull-quote on dark, gridded
        method section.
      </Caption>
    </div>
  );
}
