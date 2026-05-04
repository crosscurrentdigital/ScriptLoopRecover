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
      className="flex min-h-screen flex-col"
      style={{ background: BRAND.colors.paper, ...font }}
    >
      {/* HEADER */}
      <header
        className="border-b border-zinc-200"
        style={{ background: BRAND.colors.paper }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-5 md:px-10 md:py-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 text-zinc-900 active:opacity-80 md:min-h-0 md:hover:opacity-80"
            aria-label={`${BRAND.name} home`}
          >
            <BrandMark className="h-7 w-7" title={`${BRAND.name} logo`} />
            <span className="text-xl font-bold tracking-tight" style={font}>
              {BRAND.name}
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-zinc-700 sm:gap-5 md:gap-8">
            <a href="#method" className="hover:text-zinc-900 max-md:hidden">
              Method
            </a>
            <Link
              to="/sign-in"
              className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap hover:text-zinc-900 md:min-h-0"
            >
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 sm:px-5"
              style={{ background: BRAND.colors.ink }}
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden px-6 pb-24 pt-16 md:px-10 md:pb-32 md:pt-24">
          {/* Watermark brand mark */}
          <div
            className="pointer-events-none absolute -right-24 top-1/2 hidden -translate-y-1/2 opacity-[0.05] md:block"
            aria-hidden="true"
          >
            <BrandMark className="h-[520px] w-[520px]" strokeWidth={5} />
          </div>

          <div className="relative mx-auto max-w-7xl">
            {/* Eyebrow */}
            <div className="mb-10 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">
                Issue №01
              </div>
              <div className="hidden h-px w-10 bg-zinc-300 sm:block" />
              <div
                className="text-sm font-medium"
                style={{ color: BRAND.colors.violet }}
              >
                The looping method
              </div>
            </div>

            {/* Headline */}
            <h1
              className="font-bold text-zinc-900"
              style={{
                ...font,
                fontSize: "clamp(52px, 9vw, 112px)",
                lineHeight: 0.92,
                letterSpacing: "-0.045em",
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

            {/* Sub + CTAs row */}
            <div className="mt-12 grid grid-cols-12 gap-x-8 gap-y-8 md:mt-16">
              <div className="col-span-12 md:col-span-7">
                <p
                  className="border-l-2 pl-5 text-base leading-relaxed text-zinc-700 md:text-lg"
                  style={{ borderColor: BRAND.colors.violet }}
                >
                  Paste any text. Generate a voice. Loop until it lives in your
                  head. No flashcards. No notes. Just sound and recall.
                </p>
              </div>
              <div className="col-span-12 flex flex-col items-start gap-3 md:col-span-5 md:items-end md:justify-end">
                <Link
                  to="/sign-up"
                  className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-90"
                  style={{ background: BRAND.colors.violet }}
                >
                  Begin · 60-second setup
                </Link>
                <span className="text-xs text-zinc-500">
                  Free · No credit card
                </span>
              </div>
            </div>

            {/* Hero footnote */}
            <p className="mt-10 max-w-md text-xs leading-relaxed text-zinc-500 md:mt-12">
              A new way to memorize lines, lectures, scripture, and speeches —
              built around how your brain actually consolidates language.
            </p>
          </div>
        </section>

        {/* PULL-QUOTE BAND */}
        <section
          className="border-y border-zinc-200 px-6 py-20 md:px-10 md:py-24"
          style={{ background: BRAND.colors.ink, color: BRAND.colors.paper }}
        >
          <div className="mx-auto max-w-7xl">
            <figure className="mx-auto max-w-4xl text-center md:text-left">
              <BrandMark
                className="mx-auto mb-7 h-9 w-9 md:mx-0"
                primary={BRAND.colors.violetLight}
                secondary={BRAND.colors.tealLight}
              />
              <blockquote
                className="font-bold leading-[1.15] tracking-tight"
                style={{
                  ...font,
                  fontSize: "clamp(28px, 3.4vw, 44px)",
                  letterSpacing: "-0.02em",
                }}
              >
                &ldquo;Memorize anything by listening to it on loop.&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-sm text-zinc-400">
                — <cite className="not-italic">The ScriptLoop method, in one sentence.</cite>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* METHOD */}
        <section id="method" className="px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 max-w-3xl md:mb-16">
              <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">
                  Method
                </div>
                <div className="hidden h-px w-10 bg-zinc-300 sm:block" />
                <div
                  className="text-sm font-medium"
                  style={{ color: BRAND.colors.violet }}
                >
                  Three movements
                </div>
              </div>
              <h2
                className="font-bold tracking-tight text-zinc-900"
                style={{
                  ...font,
                  fontSize: "clamp(36px, 5vw, 64px)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.03em",
                }}
              >
                Listen.{" "}
                <span style={{ color: BRAND.colors.violet }}>Hide.</span>{" "}
                <span style={{ color: BRAND.colors.teal }}>Loop.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 md:grid-cols-3">
              {MOVEMENTS.map(({ n, title, body, hue }) => (
                <div
                  key={title}
                  className="flex flex-col bg-white p-8 md:p-10"
                >
                  <div
                    className="mb-6 font-bold leading-none"
                    style={{
                      color: hue,
                      fontFamily: BRAND.font,
                      fontSize: "clamp(36px, 3.2vw, 44px)",
                    }}
                  >
                    {n}
                  </div>
                  <h3
                    className="mb-3 font-bold tracking-tight text-zinc-900"
                    style={{ fontSize: "clamp(20px, 1.6vw, 24px)" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="leading-relaxed text-zinc-600"
                    style={{ fontSize: "clamp(14px, 1vw, 16px)" }}
                  >
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="px-6 pb-24 md:px-10 md:pb-32">
          <div
            className="mx-auto max-w-7xl rounded-2xl border border-zinc-200 px-8 py-14 md:px-14 md:py-20"
            style={{ background: "#FFFFFF" }}
          >
            <div className="grid grid-cols-12 items-end gap-x-8 gap-y-10">
              <div className="col-span-12 md:col-span-7">
                <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-zinc-400">
                  Begin
                </div>
                <h2
                  className="font-bold tracking-tight text-zinc-900"
                  style={{
                    ...font,
                    fontSize: "clamp(34px, 4.4vw, 60px)",
                    lineHeight: 1.02,
                    letterSpacing: "-0.03em",
                  }}
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
              <div className="col-span-12 flex flex-col items-start gap-3 md:col-span-5 md:items-end">
                <Link
                  to="/sign-up"
                  className="inline-flex items-center justify-center rounded-full px-9 py-4 text-base font-semibold text-white shadow-md hover:opacity-90 md:text-lg"
                  style={{ background: BRAND.colors.violet }}
                >
                  Start memorizing — free
                </Link>
                <span className="text-xs text-zinc-500">
                  First 10 minutes of audio on us.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
