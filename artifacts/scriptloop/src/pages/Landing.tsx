import { Link } from "react-router-dom";
import { Mic2, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/Footer";

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
            className="inline-flex min-h-11 items-center text-xl font-semibold tracking-tight active:opacity-80 sm:min-h-0 sm:hover:opacity-80"
            aria-label="ScriptLoop home"
          >
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#d4a574]" aria-hidden="true" />
            ScriptLoop
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/sign-in">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 text-center sm:py-24">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[#d4a574]">
            ScriptLoop
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Memorize anything by listening to it on loop.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Paste any text. Generate a voice. Loop until it lives in your head.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/sign-up">Start memorizing — free</Link>
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16 sm:pb-24">
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardContent className="space-y-3 p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#d4a574]/15 text-[#d4a574]">
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
