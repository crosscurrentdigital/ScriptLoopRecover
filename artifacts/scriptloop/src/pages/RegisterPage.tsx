import { AuthView } from "@neondatabase/auth/react/ui";
import { Link } from "react-router-dom";
import { BrandMark, BRAND } from "@/lib/brand";

const font = { fontFamily: BRAND.font };

export default function RegisterPage() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: BRAND.colors.paper, ...font }}
    >
      <header className="px-6 py-5 md:px-10 md:py-6">
        <Link
          to="/"
          aria-label={`${BRAND.name} home`}
          className="inline-flex items-center gap-2 text-zinc-900 hover:opacity-80"
        >
          <BrandMark className="h-7 w-7" title={`${BRAND.name} logo`} />
          <span className="text-xl font-bold tracking-tight" style={font}>
            {BRAND.name}
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400">
              Begin
            </div>
            <h1
              className="mt-2 text-2xl font-bold tracking-tight text-zinc-900"
              style={font}
            >
              Create your account
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              60-second setup. First 10 minutes of audio on us.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <AuthView pathname="/sign-up" />
          </div>
          <p className="mt-6 text-center text-xs text-zinc-500">
            By creating an account you agree to our{" "}
            <Link
              to="/terms"
              className="underline underline-offset-4 hover:text-zinc-800"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="underline underline-offset-4 hover:text-zinc-800"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
