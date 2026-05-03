import { Link } from "react-router-dom";
import { Mic2, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { BrandMark, BRAND } from "@/lib/brand";

const FEATURES = [
  {
    icon: Mic2,
    title: "AI voices",
    description:
      "Pick a natural-sounding voice and turn any text into clean spoken audio.",
  },
  {
    icon: EyeOff,
    title: "Progressive word-hiding",
    description:
      "Words fade out as you learn, so your memory does the heavy lifting.",
  },
  {
    icon: Sparkles,
    title: "Zen Mode",
    description:
      "A distraction-free, full-screen practice space — just you and the loop.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 active:opacity-80 sm:min-h-0 sm:hover:opacity-80"
            aria-label={`${BRAND.name} home`}
          >
            <BrandMark className="h-7 w-7" title={`${BRAND.name} logo`} />
            <span
              className="text-xl font-semibold tracking-tight"
              style={{ fontFamily: BRAND.font }}
            >
              {BRAND.name}
            </span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/sign-in">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 text-center sm:py-24">
          <div className="mx-auto mb-6 flex justify-center">
            <BrandMark className="h-16 w-16" title={`${BRAND.name} logo`} />
          </div>
          <p
            className="mb-4 text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ color: BRAND.colors.violet }}
          >
            {BRAND.name}
          </p>
          <h1
            className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            style={{ fontFamily: BRAND.font }}
          >
            Memorize anything by listening to it on loop.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Paste any text. Generate a voice. Loop until it lives in your head.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto text-white hover:opacity-90"
              style={{ background: BRAND.colors.violet }}
            >
              <Link to="/sign-up">Start memorizing — free</Link>
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16 sm:pb-24">
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardContent className="space-y-3 p-6">
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md"
                    style={{
                      background: `${BRAND.colors.violet}14`,
                      color: BRAND.colors.violet,
                    }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
