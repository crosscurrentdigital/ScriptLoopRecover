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

  const { data: script, isLoading, error } = useScript(scriptId);
  const { data: voices } = useVoices();
  const deleteScript = useDeleteScript();

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
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">
          {error ? `Could not load script: ${error.message}` : "Script not found."}
        </p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const voiceName = voices?.find((v) => v.voice_id === script.voiceId)?.name;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">← Dashboard</Link>
            </Button>
            <h1 className="text-lg font-semibold truncate max-w-[40ch]">
              {script.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/scripts/${script.id}/edit`}>Edit</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteScript.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audio</CardTitle>
            <CardDescription>
              {script.audioUrl
                ? voiceName
                  ? `Voice: ${voiceName}`
                  : "Press loop to memorize."
                : "No audio yet — open the editor to generate."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {script.audioUrl ? (
              <AudioPlayer
                src={script.audioUrl}
                gapSeconds={script.loopGapSeconds ?? 2}
              />
            ) : (
              <Button asChild variant="secondary">
                <Link to={`/scripts/${script.id}/edit`}>Generate audio</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Script</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {script.content || "(empty)"}
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
