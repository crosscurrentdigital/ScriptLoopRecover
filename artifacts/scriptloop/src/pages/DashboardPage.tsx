import { Link } from "react-router-dom";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useScripts, useDeleteScript } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ScriptList } from "@/components/ScriptList";

function CardSkeleton() {
  return (
    <Card className="flex flex-col">
      <div className="flex flex-col space-y-3 p-6 pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 p-6 pt-0">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </Card>
  );
}

function GridSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading scripts"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: scripts, isLoading, error, refetch, isFetching } = useScripts();
  const deleteScript = useDeleteScript();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number, title: string) => {
    setDeletingId(id);
    try {
      await deleteScript.mutateAsync(id);
      toast({ title: "Script deleted", description: `"${title}" was removed.` });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed";
      toast({
        title: "Couldn't delete script",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const scriptCount = scripts?.length ?? 0;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Your scripts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : scriptCount > 0
                ? `${scriptCount} script${scriptCount === 1 ? "" : "s"}`
                : "Add a script to start memorizing"}
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/scripts/new">
            <Plus className="h-4 w-4" />
            New script
          </Link>
        </Button>
      </div>

      {isLoading && <GridSkeleton />}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-destructive">
              Failed to load scripts: {error.message}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Retrying…" : "Try again"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && scripts && (
        <ScriptList
          scripts={scripts}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </main>
  );
}
