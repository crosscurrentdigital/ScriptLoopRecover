import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useAdminDeleteScript,
  useAdminUserDetail,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import { ConfirmTypedDialog } from "@/components/ConfirmTypedDialog";
import type { Script } from "@/db/schema";

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id;
  const { data, isLoading, error, refetch, isFetching } =
    useAdminUserDetail(userId);
  const deleteScript = useAdminDeleteScript();
  const { toast } = useToast();
  const [pending, setPending] = useState<Script | null>(null);

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <NetworkErrorState
          message={error instanceof Error ? error.message : "Failed to load."}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </main>
    );
  }

  const handleDelete = async () => {
    if (!pending) return;
    try {
      await deleteScript.mutateAsync(pending.id);
      toast({
        title: "Script deleted",
        description: `"${pending.title}" has been removed.`,
      });
      setPending(null);
      refetch();
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/admin/users"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          ← All users
        </Link>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{data?.user.email ?? "Loading…"}</CardTitle>
          <CardDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <>
                {data?.user.name && <span>{data.user.name} · </span>}
                Joined{" "}
                {data
                  ? new Date(data.user.createdAt).toLocaleDateString()
                  : "—"}
                {data?.user.isAdmin && " · admin"}
                {data?.user.disabled && " · disabled"}
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">
        Scripts ({data?.scripts.length ?? 0})
      </h2>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : data && data.scripts.length > 0 ? (
        <div className="space-y-2">
          {data.scripts.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{s.title}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {s.content.slice(0, 120)}
                    {s.content.length > 120 ? "…" : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/scripts/${s.id}`}>Open</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/scripts/${s.id}/edit`}>Edit</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setPending(s)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No scripts yet.</p>
      )}

      <ConfirmTypedDialog
        open={pending !== null}
        onOpenChange={(next) => !next && setPending(null)}
        title="Delete script?"
        description={
          <span>
            This permanently deletes <strong>{pending?.title}</strong>. This
            cannot be undone.
          </span>
        }
        confirmText="delete"
        actionLabel="Delete script"
        onConfirm={handleDelete}
        busy={deleteScript.isPending}
      />
    </main>
  );
}
