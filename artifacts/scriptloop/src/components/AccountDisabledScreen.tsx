import { authClient } from "@/lib/auth-client";

export function AccountDisabledScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">Account disabled</h1>
        <p className="text-muted-foreground">
          Your account has been disabled. Please contact an administrator if
          you think this is a mistake.
        </p>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          onClick={() => {
            void authClient.signOut().finally(() => {
              window.location.href = "/sign-in";
            });
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
