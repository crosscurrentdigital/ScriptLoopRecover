import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { BrandMark, BRAND } from "@/lib/brand";

const font = { fontFamily: BRAND.font };

const MOVEMENTS = [
  {
    n: "I.",
    title: "Listen",
    body: "Choose a natural-sounding voice. Your text becomes audio you can play anywhere.",
    hue: BRAND.colors.violet,
  },
  {
    n: "II.",
    title: "Hide",
    body: "Words fade out as you progress. The page becomes a test, not a script.",
    hue: BRAND.colors.teal,
  },
  {
    n: "III.",
    title: "Loop",
    body: "Zen Mode loops the audio in the background. The lines settle in.",
    hue: BRAND.colors.violet,
  },
];

export default function Landing() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: BRAND.colors.paper, ...font }}
    >
      {/* HEADER */}
      <header className="border-b border-zinc-200 bg-[color:var(--paper,#FAFAFA)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-5 sm:px-12 sm:py-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 text-zinc-900 active:opacity-80 sm:min-h-0 sm:hover:opacity-80"
            aria-label={`${BRAND.name} home`}
          >
            <BrandMark className="h-7 w-7" title={`${BRAND.name} logo`} />
            <span
              className="text-xl font-bold tracking-tight"
              style={font}
            >
              {BRAND.name}
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-zinc-700 sm:gap-8">
            <a href="#method" className="hidden sm:inline hover:text-zinc-900">
              Method
            </a>
            <Link to="/sign-in" className="hidden sm:inline hover:text-zinc-900">
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="inline-flex min-h-11 items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              style={{ background: BRAND.colors.ink }}
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO — magazine layout, oversized type, giant background mark */}
        <section className="relative overflow-hidden px-6 pb-16 pt-12 sm:px-12 sm:pb-24 sm:pt-20">
          <div
            className="pointer-events-none absolute -right-32 -top-12 hidden opacity-[0.07] sm:block"
            aria-hidden="true"
          >
            <BrandMark
              className="h-[700px] w-[700px]"
              strokeWidth={5}
            />
          </div>

          <div className="relative mx-auto grid max-w-7xl grid-cols-12 gap-6">
            {/* Left rail: editorial meta */}
            <div className="col-span-12 sm:col-span-3 sm:pt-2">
              <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">
                Issue №01
              </div>
              <div
                className="mt-2 text-sm font-medium"
                style={{ color: BRAND.colors.violet }}
              >
                The looping method
              </div>
              <div className="mt-6 hidden h-px w-12 bg-zinc-300 sm:block sm:mt-8" />
              <p className="mt-3 hidden text-xs leading-relaxed text-zinc-500 sm:block sm:mt-4">
                A new way to memorize lines, lectures, scripture, and speeches —
                built around how your brain actually consolidates language.
              </p>
            </div>

            {/* Center: huge headline */}
            <div className="col-span-12 sm:col-span-9">
              <h1
                className="font-bold text-zinc-900"
                style={{
                  ...font,
                  fontSize: "clamp(56px, 9vw, 120px)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.04em",
                }}
              >
                Memorize
                <br />
                <span style={{ color: BRAND.colors.violet }}>anything</span>
                <br />
                on{" "}
                <span className="relative inline-block">
                  <span style={{ color: BRAND.colors.teal }}>loop.</span>
                  <span
                    className="absolute -bottom-1 left-0 right-0 h-2 rounded-full"
                    style={{ background: `${BRAND.colors.tealLight}55` }}
                    aria-hidden="true"
                  />
                </span>
              </h1>

              <div className="mt-8 grid grid-cols-12 items-end gap-6 sm:mt-12">
                <p
                  className="col-span-12 border-l-2 pl-5 text-base leading-relaxed text-zinc-700 sm:col-span-7 sm:text-lg"
                  style={{ borderColor: BRAND.colors.violet }}
                >
                  Paste any text. Generate a voice. Loop until it lives in your
                  head. No flashcards. No notes. Just sound and recall.
                </p>
                <div className="col-span-12 flex flex-col items-start gap-3 sm:col-span-5">
                  <Link
                    to="/sign-up"
                    className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-90"
                    style={{ background: BRAND.colors.violet }}
                  >
                    Begin · 60-second setup
                  </Link>
                  <span className="ml-2 text-xs text-zinc-500">
                    Free · No credit card
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PULL-QUOTE BAND — uses the tagline (no fabricated testimonials) */}
        <section
          className="border-y border-zinc-200 px-6 py-16 sm:px-12 sm:py-20"
          style={{ background: BRAND.colors.ink, color: BRAND.colors.paper }}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-12 items-center gap-6">
            <div className="col-span-12 sm:col-span-2">
              <BrandMark
                className="h-12 w-12"
                primary={BRAND.colors.violetLight}
                secondary={BRAND.colors.tealLight}
              />
            </div>
            <div className="col-span-12 sm:col-span-10">
              <figure>
                <blockquote
                  className="font-bold leading-tight tracking-tight"
                  style={{ ...font, fontSize: "clamp(28px, 3.2vw, 40px)" }}
                >
                  "Memorize anything by listening to it on loop."
                </blockquote>
                <figcaption className="mt-4 text-sm text-zinc-400">
                  — <cite className="not-italic">The ScriptLoop method, in one sentence.</cite>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* METHOD — three movements grid */}
        <section
          id="method"
          className="px-6 py-16 sm:px-12 sm:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 grid grid-cols-12 gap-6 sm:mb-12">
              <div className="col-span-12 sm:col-span-3">
                <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">
                  Method
                </div>
                <div
                  className="mt-1 text-sm font-medium"
                  style={{ color: BRAND.colors.violet }}
                >
                  Three movements
                </div>
              </div>
              <div className="col-span-12 sm:col-span-9">
                <h2
                  className="font-bold tracking-tight text-zinc-900"
                  style={{ fontSize: "clamp(28px, 3.2vw, 40px)" }}
                >
                  Listen. Hide. Loop.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-px bg-zinc-200 sm:grid-cols-3">
              {MOVEMENTS.map(({ n, title, body, hue }) => (
                <div key={title} className="bg-white p-8 sm:p-10">
                  <div
                    className="mb-5 font-bold sm:mb-6"
                    style={{
                      color: hue,
                      fontFamily: BRAND.font,
                      fontSize: "clamp(36px, 3.5vw, 48px)",
                    }}
                  >
                    {n}
                  </div>
                  <h3
                    className="mb-3 font-bold tracking-tight text-zinc-900"
                    style={{ fontSize: "clamp(20px, 1.8vw, 26px)" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="leading-relaxed text-zinc-600"
                    style={{ fontSize: "clamp(14px, 1.1vw, 17px)" }}
                  >
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="px-6 pb-16 sm:px-12 sm:pb-24">
          <div className="mx-auto grid max-w-7xl grid-cols-12 items-center gap-6">
            <div className="col-span-12 sm:col-span-7">
              <h2
                className="font-bold tracking-tight text-zinc-900"
                style={{ fontSize: "clamp(32px, 4vw, 56px)", lineHeight: 1.05 }}
              >
                Your next pitch.
                <br />
                Your next monologue.
                <br />
                <span style={{ color: BRAND.colors.violet }}>
                  In your head by Friday.
                </span>
              </h2>
            </div>
            <div className="col-span-12 flex flex-col items-start gap-3 sm:col-span-5 sm:items-end">
              <Link
                to="/sign-up"
                className="inline-flex items-center justify-center rounded-full px-9 py-4 text-base font-semibold text-white shadow-md hover:opacity-90 sm:text-lg"
                style={{ background: BRAND.colors.violet }}
              >
                Start memorizing — free
              </Link>
              <span className="text-xs text-zinc-500">
                First 10 minutes of audio on us.
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
