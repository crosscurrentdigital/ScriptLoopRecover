import { AuthView } from "@neondatabase/auth/react/ui";
import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-center mb-6">
            ScriptLoop
          </h1>
          <AuthView pathname="/sign-in" />
        </div>
      </div>
      <footer className="px-4 py-6 text-center text-xs text-muted-foreground">
        <Link to="/privacy" className="hover:text-foreground hover:underline">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <Link to="/terms" className="hover:text-foreground hover:underline">
          Terms
        </Link>
      </footer>
    </div>
  );
}
