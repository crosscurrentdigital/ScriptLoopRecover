import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useAdminDeleteUser,
  useAdminUserAction,
  useAdminUsers,
  useMe,
  type AdminUserRow,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import { ConfirmTypedDialog } from "@/components/ConfirmTypedDialog";

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const me = useMe();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(
    () => ({ q: searchTerm || undefined, page, pageSize: PAGE_SIZE }),
    [searchTerm, page],
  );
  const { data, isLoading, error, refetch, isFetching } = useAdminUsers(
    params,
    true,
  );
  const action = useAdminUserAction();
  const deleteUser = useAdminDeleteUser();
  const { toast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null);

  const myId = me.data?.userId;

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const runAction = async (
    user: AdminUserRow,
    a: "promote" | "demote" | "disable" | "enable",
  ) => {
    try {
      await action.mutateAsync({ userId: user.id, action: a });
      toast({ title: "Updated", description: `${user.email}: ${a}d.` });
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteUser.mutateAsync(pendingDelete.id);
      toast({
        title: "User deleted",
        description: `${pendingDelete.email} has been removed.`,
      });
      setPendingDelete(null);
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} total` : "Loading…"}
          </p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearchTerm(searchInput.trim());
          }}
        >
          <Input
            placeholder="Search email or name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {error ? (
        <NetworkErrorState
          message={error instanceof Error ? error.message : "Failed to load."}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Scripts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data && data.users.length > 0 ? (
                data.users.map((u) => {
                  const isSelf = u.id === myId;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/admin/users/${u.id}`}
                          className="underline underline-offset-4"
                        >
                          {u.email}
                        </Link>
                        {u.name && (
                          <div className="text-xs text-muted-foreground">
                            {u.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.scriptCount}
                      </TableCell>
                      <TableCell>
                        {u.isAdmin && (
                          <span className="mr-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            admin
                          </span>
                        )}
                        {u.disabled && (
                          <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                            disabled
                          </span>
                        )}
                        {!u.isAdmin && !u.disabled && (
                          <span className="text-xs text-muted-foreground">
                            user
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="space-x-1 text-right">
                        {u.isAdmin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSelf || action.isPending}
                            onClick={() => runAction(u, "demote")}
                          >
                            Demote
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={action.isPending}
                            onClick={() => runAction(u, "promote")}
                          >
                            Promote
                          </Button>
                        )}
                        {u.disabled ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={action.isPending}
                            onClick={() => runAction(u, "enable")}
                          >
                            Enable
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSelf || action.isPending}
                            onClick={() => runAction(u, "disable")}
                          >
                            Disable
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isSelf}
                          onClick={() => setPendingDelete(u)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmTypedDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
        title="Delete user?"
        description={
          <span>
            This permanently deletes{" "}
            <strong>{pendingDelete?.email}</strong> and all of their scripts
            and preferences. This cannot be undone.
          </span>
        }
        confirmText={pendingDelete?.email ?? ""}
        actionLabel="Delete user"
        onConfirm={confirmDelete}
        busy={deleteUser.isPending}
      />
    </main>
  );
}
