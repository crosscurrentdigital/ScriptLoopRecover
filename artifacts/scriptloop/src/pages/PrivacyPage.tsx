import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
  const lastUpdated = "May 2026";
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight hover:opacity-80"
          >
            ScriptLoop
          </Link>
          <Link
            to="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-10">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p>
            <em>Last updated: {lastUpdated}</em>
          </p>

          <p>
            ScriptLoop (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
            provides a web tool that turns your written scripts into looping
            audio so you can memorize them. This Privacy Policy explains what
            we collect, why, and what choices you have.
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Account information.</strong> When you sign up we collect
              your email address and a hashed password through our
              authentication provider, Neon Auth (powered by Better Auth). We
              never see or store your password in plaintext.
            </li>
            <li>
              <strong>Script content.</strong> The text you paste, the title
              you give it, your chosen voice, and your loop-gap setting are
              stored in our PostgreSQL database (Neon) so you can come back to
              them later.
            </li>
            <li>
              <strong>Generated audio.</strong> When you generate audio, we
              send your script text to ElevenLabs for text-to-speech synthesis
              and store the resulting audio file in Cloudflare R2 object
              storage. Audio files are served from a public URL but the URL is
              not publicly listed.
            </li>
            <li>
              <strong>Operational logs.</strong> Server-side errors and 5xx
              responses are sent to Sentry for debugging. These reports may
              include your user id and the route that errored, but not your
              script content or password.
            </li>
            <li>
              <strong>Analytics.</strong> We use Plausible Analytics, a
              privacy-friendly, cookie-less analytics tool. Plausible records
              aggregate pageviews and basic referrer / device information. It
              does not use cookies, does not collect personal data, and is
              GDPR-compliant by design.
            </li>
          </ul>

          <h2>How we use information</h2>
          <ul>
            <li>To let you sign in and access your scripts.</li>
            <li>To generate and play back audio of your scripts.</li>
            <li>To monitor and debug the service (Sentry).</li>
            <li>
              To understand aggregate usage patterns so we can improve the
              product (Plausible).
            </li>
          </ul>

          <h2>Sharing</h2>
          <p>
            We do not sell your data. We share information only with the
            sub-processors strictly required to operate the service:
          </p>
          <ul>
            <li>Neon (database hosting and authentication)</li>
            <li>ElevenLabs (text-to-speech generation)</li>
            <li>Cloudflare R2 (audio file storage)</li>
            <li>Netlify (web hosting and serverless functions)</li>
            <li>Sentry (error tracking)</li>
            <li>Plausible Analytics (anonymous pageview analytics)</li>
          </ul>

          <h2>Retention</h2>
          <p>
            Your scripts and generated audio are kept for as long as your
            account exists. Deleting a script removes its database row and the
            associated audio reference; deleting your account removes all of
            your scripts.
          </p>

          <h2>Your rights</h2>
          <p>
            You can delete any of your scripts at any time from your
            dashboard. To delete your account or request a copy of your data,
            email us. If you are in the EU/UK you have the right to access,
            correct, port, and erase your personal data, and to lodge a
            complaint with your local data-protection authority.
          </p>

          <h2>Cookies</h2>
          <p>
            ScriptLoop uses a single first-party session cookie set by the
            authentication provider so you stay signed in. We do not set
            advertising cookies. Plausible Analytics is cookie-less.
          </p>

          <h2>Children</h2>
          <p>
            ScriptLoop is not directed at children under 13 and we do not
            knowingly collect data from them.
          </p>

          <h2>Changes</h2>
          <p>
            We may update this policy. The &ldquo;last updated&rdquo; date at
            the top will reflect any changes.
          </p>

          <h2>Contact</h2>
          <p>
            Questions or requests? Reach out via the support email listed on
            our deployment.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
