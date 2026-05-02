export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col items-center gap-2 px-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <nav
          aria-label="Legal and contact"
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1"
        >
          <a
            href="/privacy"
            className="inline-flex min-h-9 items-center px-1 hover:text-foreground hover:underline"
          >
            Privacy Policy
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="/terms"
            className="inline-flex min-h-9 items-center px-1 hover:text-foreground hover:underline"
          >
            Terms of Service
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="mailto:hello@scriptloop.app"
            className="inline-flex min-h-9 items-center px-1 hover:text-foreground hover:underline"
          >
            Contact
          </a>
        </nav>
        <p className="text-xs">© 2025 102:18 INC. Built to glorify God.</p>
      </div>
    </footer>
  );
}

export default Footer;
