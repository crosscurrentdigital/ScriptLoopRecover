import { Link } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { useScripts, useDeleteScript } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const session = authClient.useSession();
  const user = session.data?.user;
  const { data: scripts, isLoading, error } = useScripts();
  const deleteScript = useDeleteScript();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/sign-in";
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteScript.mutateAsync(id);
      toast({ title: "Script deleted" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your scripts</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {scripts?.length
                ? `${scripts.length} script${scripts.length === 1 ? "" : "s"}`
                : "Add a script to start memorizing"}
            </p>
          </div>
          <Button asChild>
            <Link to="/scripts/new">New script</Link>
          </Button>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                Failed to load scripts: {error.message}
              </p>
            </CardContent>
          </Card>
        )}

        {scripts && scripts.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No scripts yet</CardTitle>
              <CardDescription>
                Create your first script and ScriptLoop will generate audio you
                can loop to memorize.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/scripts/new">Create your first script</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {scripts && scripts.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scripts.map((script) => (
              <Card key={script.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">{script.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {script.content.slice(0, 120) || "(empty)"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {script.audioUrl ? "♪ audio ready" : "no audio yet"}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/scripts/${script.id}`}>Open</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(script.id, script.title)}
                      disabled={deleteScript.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
