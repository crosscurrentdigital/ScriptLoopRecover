import { useSession, signOut } from "@/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } });
    toast({ title: "Signed out" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-semibold">ScriptLoop</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {session?.user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">
            Welcome, {session?.user.name ?? "there"}
          </h2>
          <p className="text-muted-foreground mt-1">
            Your scripts will appear here. Add your first script to get started.
          </p>
        </div>

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Phase 1 Complete</CardTitle>
            <CardDescription>
              Authentication is working. Script management coming next.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You are signed in as <strong>{session?.user.email}</strong>.
              The database schema, Better Auth integration, and Netlify
              function scaffolding are all set up.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
