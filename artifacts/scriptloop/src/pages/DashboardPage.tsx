import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const session = authClient.useSession();
  const user = session.data?.user;

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/sign-in";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-semibold">ScriptLoop</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">
            Welcome, {user?.name ?? "there"}
          </h2>
          <p className="text-muted-foreground mt-1">
            Your scripts will appear here. Add your first script to get started.
          </p>
        </div>

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Auth Ready</CardTitle>
            <CardDescription>
              Neon Auth is working. Script management coming next.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Signed in as <strong>{user?.email}</strong>.
              User data syncs automatically to{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                neon_auth.users_sync
              </code>
              .
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
