import { Link } from "react-router-dom";
import { BrandMark, BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer
      className="border-t border-zinc-200"
      style={{ background: BRAND.colors.paper }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-8 text-xs text-zinc-500 sm:flex-row sm:justify-between md:px-10">
        <div className="flex items-center gap-2 text-zinc-700">
          <BrandMark className="h-5 w-5" title={`${BRAND.name} logo`} />
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ fontFamily: BRAND.font }}
          >
            {BRAND.name}
          </span>
        </div>
        <nav
          aria-label="Legal and contact"
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
        >
          <Link
            to="/privacy"
            className="inline-flex min-h-9 items-center px-1 hover:text-zinc-900 hover:underline"
          >
            Privacy
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            to="/terms"
            className="inline-flex min-h-9 items-center px-1 hover:text-zinc-900 hover:underline"
          >
            Terms
          </Link>
          <span aria-hidden="true">·</span>
          <a
            href="mailto:hello@scriptloop.app"
            className="inline-flex min-h-9 items-center px-1 hover:text-zinc-900 hover:underline"
          >
            Contact
          </a>
        </nav>
        <p className="text-[11px] text-zinc-400">
          © 2025 102:18 INC. Built to glorify God.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
