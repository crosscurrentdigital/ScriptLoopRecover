import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";

export default function TermsPage() {
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
          <h1>Terms of Service</h1>
          <p>
            <em>Last updated: {lastUpdated}</em>
          </p>

          <p>
            By creating an account or otherwise using ScriptLoop (the
            &ldquo;Service&rdquo;) you agree to these Terms of Service.
            ScriptLoop is provided as a hobby/indie tool, on an
            &ldquo;as-is&rdquo; basis, with no warranties.
          </p>

          <h2>Eligibility</h2>
          <p>You must be at least 13 years old to use ScriptLoop.</p>

          <h2>Your account</h2>
          <p>
            You are responsible for keeping your sign-in credentials safe and
            for everything that happens under your account. Tell us promptly
            if you suspect unauthorised access.
          </p>

          <h2>Acceptable use</h2>
          <ul>
            <li>
              Don&rsquo;t upload content you don&rsquo;t have the right to
              synthesize, including copyrighted scripts you don&rsquo;t own a
              license to or material that violates anyone&rsquo;s rights.
            </li>
            <li>
              Don&rsquo;t generate audio that impersonates a real person, that
              is hateful or harassing, that depicts minors in sexual contexts,
              or that violates ElevenLabs&rsquo; usage policies.
            </li>
            <li>
              Don&rsquo;t attempt to abuse, overload, reverse-engineer, or
              circumvent rate limits on the Service. Audio generation is
              limited to 20 requests per user per hour.
            </li>
            <li>
              Script content is limited to 2,000 characters per script.
            </li>
          </ul>

          <h2>Your content</h2>
          <p>
            You retain ownership of any text you paste into ScriptLoop and the
            audio generated from it. You grant us a limited license to store,
            transmit, and process that content solely to operate the Service
            (including sending the text to ElevenLabs for synthesis and
            storing the resulting audio in Cloudflare R2).
          </p>
          <p>
            <strong>Audio storage notice.</strong> Generated audio files are
            stored at a public, hard-to-guess URL on Cloudflare R2. Anyone who
            obtains the URL can play the audio without signing in. We ask you
            to acknowledge this in-app before your first generation, and we
            recommend you only generate audio for content you are comfortable
            having world-readable at an unguessable URL. You can rotate the
            URL at any time by regenerating the audio from the script&rsquo;s
            detail page. See the{" "}
            <Link to="/privacy" className="underline underline-offset-2">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>

          <h2>Third-party services</h2>
          <p>
            ScriptLoop relies on Neon (database / auth), ElevenLabs (TTS),
            Cloudflare R2 (audio storage), Netlify (hosting), Sentry (error
            tracking), and Plausible (analytics). Your use of the Service is
            also subject to those providers&rsquo; terms.
          </p>

          <h2>Service changes &amp; availability</h2>
          <p>
            We may change, suspend, or discontinue any part of the Service at
            any time. We do not guarantee any specific uptime, and the Service
            may be unavailable from time to time for maintenance, third-party
            outages, or other reasons.
          </p>

          <h2>Termination</h2>
          <p>
            You can stop using ScriptLoop at any time. We may suspend or
            terminate your account if you violate these Terms.
          </p>

          <h2>Disclaimer of warranties</h2>
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
            AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL
            SCRIPTLOOP OR ITS OPERATORS BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
            LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL ARISING OUT OF YOUR
            USE OF THE SERVICE.
          </p>

          <h2>Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. The &ldquo;last
            updated&rdquo; date at the top reflects the latest revision.
            Continued use of the Service after a change means you accept the
            updated Terms.
          </p>

          <h2>Contact</h2>
          <p>
            Reach out via the support email listed on our deployment with any
            questions.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
