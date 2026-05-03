import { Link } from "react-router-dom";
import { useAdminOverview } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NetworkErrorState } from "@/components/NetworkErrorState";

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: number | string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const { data, isLoading, error, refetch, isFetching } =
    useAdminOverview(true);

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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform stats at a glance.
          </p>
        </div>
        <Link
          to="/admin/users"
          className="text-sm font-medium underline underline-offset-4"
        >
          Manage users →
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total users"
          value={data?.totalUsers ?? 0}
          loading={isLoading}
        />
        <StatCard
          title="Total admins"
          value={data?.totalAdmins ?? 0}
          loading={isLoading}
        />
        <StatCard
          title="Total scripts"
          value={data?.totalScripts ?? 0}
          loading={isLoading}
        />
        <StatCard
          title="Scripts (last 7 days)"
          value={data?.scriptsLast7Days ?? 0}
          loading={isLoading}
        />
        <StatCard
          title="Scripts (last 30 days)"
          value={data?.scriptsLast30Days ?? 0}
          loading={isLoading}
        />
      </div>
    </main>
  );
}
