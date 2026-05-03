import React from "react";
import { Play, Pause, Volume2, EyeOff, Repeat } from "lucide-react";
import { BRAND, Mark, Lockup, Caption } from "./_shared";

const font = { fontFamily: BRAND.font };

export function LandingB_Studio() {
  return (
    <div className="w-[1280px] bg-zinc-950 text-white" style={font}>
      {/* HEADER */}
      <header className="border-b border-white/10 px-12 py-5 flex items-center justify-between">
        <Lockup dark />
        <nav className="flex items-center gap-7 text-sm text-zinc-300 font-medium">
          <span>Product</span>
          <span>Voices</span>
          <span>Pricing</span>
          <button
            className="px-4 py-2 rounded-md text-zinc-950 text-sm font-semibold"
            style={{ background: BRAND.tealLight }}
          >
            Sign in
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* gradient blob */}
        <div
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-40 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${BRAND.violetMid} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${BRAND.teal} 0%, transparent 70%)`,
          }}
        />

        <div className="relative px-12 pt-24 pb-20 grid grid-cols-2 gap-12 items-center">
          {/* LEFT: copy */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-7 border border-white/10 bg-white/5"
              style={{ color: BRAND.tealLight }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: BRAND.tealLight }}
              />
              New · ElevenLabs voices
            </div>
            <h1
              className="text-6xl font-bold tracking-tight leading-[1.05]"
              style={font}
            >
              Your script,{" "}
              <span style={{ color: BRAND.violetLight }}>looped</span> until you
              own it.
            </h1>
            <p className="mt-7 text-lg text-zinc-400 leading-relaxed max-w-lg">
              ScriptLoop turns any text into spoken audio with progressive
              word-hiding — so you stop reading and start remembering.
            </p>
            <div className="mt-10 flex items-center gap-3">
              <button
                className="px-7 py-3.5 rounded-lg text-zinc-950 text-base font-semibold hover:opacity-90"
                style={{ background: BRAND.tealLight }}
              >
                Start memorizing — free
              </button>
              <button className="px-7 py-3.5 rounded-lg text-white text-base font-semibold border border-white/20 hover:bg-white/5">
                ▸ Watch 30s demo
              </button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-zinc-500">
              <span>★★★★★ 4.9 / Product Hunt</span>
              <span>·</span>
              <span>2,400+ scripts memorized this week</span>
            </div>
          </div>

          {/* RIGHT: app preview card */}
          <div className="relative">
            <div className="rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Mark
                    className="h-5 w-5"
                    primary={BRAND.violetLight}
                    secondary={BRAND.tealLight}
                  />
                  <span className="text-sm font-medium text-zinc-300">
                    Macbeth · Act II
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500">Loop 7 / ∞</span>
              </div>
              {/* Script body */}
              <div className="px-6 py-7 space-y-2 text-zinc-300 text-base leading-relaxed">
                <p>
                  Is this a <span className="text-zinc-100 font-semibold">dagger</span>{" "}
                  which I see before me, the handle{" "}
                  <span className="text-zinc-500">toward</span> my hand?
                </p>
                <p>
                  Come, let me <span className="text-zinc-700">▒▒▒▒▒</span> thee.
                </p>
                <p className="text-zinc-700">▒ ▒▒▒▒ ▒▒▒▒, and yet I see thee still.</p>
                <p className="text-zinc-800">▒▒ ▒▒▒▒ ▒▒▒▒, ▒▒▒▒▒ ▒▒▒▒▒▒▒▒, ▒▒▒▒▒▒▒.</p>
              </div>
              {/* Player */}
              <div className="px-5 py-4 border-t border-white/10 bg-zinc-950/60">
                <div className="flex items-center gap-3">
                  <button
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ background: BRAND.tealLight, color: "#0a0a0a" }}
                  >
                    <Pause className="h-4 w-4" />
                  </button>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full w-2/3 rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${BRAND.violetLight}, ${BRAND.tealLight})`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-zinc-500 font-mono">
                      <span>0:42</span>
                      <span>1:08</span>
                    </div>
                  </div>
                  <button className="text-zinc-400 hover:text-white">
                    <Repeat className="h-4 w-4" />
                  </button>
                  <button className="text-zinc-400 hover:text-white">
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            {/* floating waveform decoration */}
            <div className="absolute -bottom-6 -right-6 flex items-end gap-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
              {[14, 22, 10, 28, 18, 32, 24, 14, 26, 20, 12].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    height: h,
                    background:
                      i % 3 === 0 ? BRAND.tealLight : BRAND.violetLight,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STAT STRIP */}
      <section className="px-12 py-10 border-y border-white/5 grid grid-cols-4 text-center">
        {[
          { stat: "9.4×", label: "faster recall" },
          { stat: "12 min", label: "average to memorize a sonnet" },
          { stat: "60+", label: "AI voices" },
          { stat: "4.9★", label: "App Store" },
        ].map(({ stat, label }) => (
          <div key={label}>
            <div
              className="text-4xl font-bold tracking-tight"
              style={{ color: BRAND.tealLight }}
            >
              {stat}
            </div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mt-2">
              {label}
            </div>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section className="px-12 py-24">
        <h2 className="text-4xl font-bold tracking-tight mb-14 max-w-2xl">
          Built for how memory actually works.
        </h2>
        <div className="grid grid-cols-3 gap-5">
          {[
            {
              icon: Play,
              title: "Spoken first",
              body: "Your ears do the lifting. Pick a voice, hit play, walk away.",
            },
            {
              icon: EyeOff,
              title: "Word-hiding",
              body: "Words fade as you learn — pure recall, no peeking.",
            },
            {
              icon: Repeat,
              title: "Zen Mode",
              body: "Full-screen, single tap to loop. No notifications, no UI.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl bg-white/[0.03] border border-white/10 p-7 hover:bg-white/[0.06] transition-colors"
            >
              <div
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg mb-5"
                style={{ background: `${BRAND.tealLight}22`, color: BRAND.tealLight }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-12 py-8 flex items-center justify-between text-sm text-zinc-500">
        <Lockup size="sm" dark />
        <span>© 2026 ScriptLoop · Privacy · Terms</span>
      </footer>

      <Caption>
        Direction B — Studio &amp; product-first. Dark hero, gradient blobs,
        live app preview card with player, stat strip, leans into the AI-voice
        product story.
      </Caption>
    </div>
  );
}
