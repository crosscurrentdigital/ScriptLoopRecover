import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AudioPlayer } from "@/components/AudioPlayer";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import { ProgressiveText } from "@/components/ProgressiveText";
import {
  useDeleteScript,
  useScript,
  useVoices,
} from "@/lib/api";

export default function ScriptDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const scriptId = params.id ? Number(params.id) : undefined;

  const { data: script, isLoading, error, refetch, isFetching } =
    useScript(scriptId);
  const { data: voices } = useVoices();
  const deleteScript = useDeleteScript();

  const [loopCount, setLoopCount] = useState(0);
  const handleLoopComplete = useCallback(
    () => setLoopCount((n) => n + 1),
    [],
  );

  const handleDelete = async () => {
    if (!scriptId || !script) return;
    if (!window.confirm(`Delete "${script.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteScript.mutateAsync(scriptId);
      toast({ title: "Script deleted" });
      navigate("/dashboard");
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">
        Loading script…
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10 space-y-3">
        <NetworkErrorState
          title="Couldn't load this script"
          message={error.message}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </main>
    );
  }

  if (!script) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base">Script not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const voiceName =
    voices?.find((v) => v.voice_id === script.voiceId)?.name ?? script.voiceId;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {script.title || "Untitled"}
          </h1>
          {voiceName && (
            <p className="mt-1 text-sm text-muted-foreground">
              Voice: {voiceName}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {script.audioUrl && (
            <Button asChild variant="default" size="sm">
              <Link to={`/scripts/${script.id}/zen`}>Enter Zen Mode</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to={`/scripts/${script.id}/edit`}>Edit</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteScript.isPending}
            className="text-destructive hover:text-destructive"
          >
            {deleteScript.isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audio</CardTitle>
          <CardDescription>
            {script.audioUrl
              ? `Loops with a ${script.loopGapSeconds ?? 2}s pause between plays.`
              : "No audio yet — audio is created when you save a new script."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {script.audioUrl ? (
            <AudioPlayer
              src={script.audioUrl}
              gapSeconds={script.loopGapSeconds ?? 2}
              defaultLooping
              onLoopComplete={handleLoopComplete}
            />
          ) : (
            <Button asChild variant="secondary">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Script</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressiveText
            text={script.content || ""}
            loopCount={loopCount}
            hideStrategy="random"
          />
        </CardContent>
      </Card>
    </main>
  );
}
