import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AudioPlayer } from "@/components/AudioPlayer";
import { NetworkErrorState } from "@/components/NetworkErrorState";
import { ProgressiveText } from "@/components/ProgressiveText";
import {
  ApiError,
  useDeleteScript,
  useGenerateAudio,
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
  const {
    data: voices,
    isLoading: voicesLoading,
    error: voicesError,
  } = useVoices();
  const deleteScript = useDeleteScript();
  const generateAudio = useGenerateAudio(scriptId ?? 0);

  const [loopCount, setLoopCount] = useState(0);
  const handleLoopComplete = useCallback(
    () => setLoopCount((n) => n + 1),
    [],
  );

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  useEffect(() => {
    // Reset to the loaded script's voice whenever the script id changes,
    // so navigating directly between scripts doesn't carry over the
    // previous script's voice selection.
    setSelectedVoiceId(script?.voiceId ?? "");
  }, [script?.id, script?.voiceId]);

  const handleRegenerate = useCallback(async () => {
    if (!scriptId || !script) return;
    if (!script.content?.trim()) {
      toast({
        title: "Nothing to regenerate",
        description: "This script has no content yet.",
        variant: "destructive",
      });
      return;
    }
    const voiceId = selectedVoiceId || script.voiceId || "";
    if (!voiceId) {
      toast({ title: "Pick a voice first", variant: "destructive" });
      return;
    }
    try {
      await generateAudio.mutateAsync({
        text: script.content,
        voiceId,
      });
      toast({ title: "Audio regenerated" });
    } catch (e) {
      let description = e instanceof Error ? e.message : undefined;
      if (e instanceof ApiError && e.retryAfterSeconds) {
        const mins = Math.max(1, Math.ceil(e.retryAfterSeconds / 60));
        description = `${description ?? "Rate limit hit."} Try again in ~${mins} min.`;
      }
      toast({
        title: "Couldn't regenerate audio",
        description,
        variant: "destructive",
      });
    }
  }, [scriptId, script, selectedVoiceId, generateAudio, toast]);

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
              : "No audio yet — pick a voice below and regenerate to create it."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {script.audioUrl ? (
            <AudioPlayer
              src={script.audioUrl}
              gapSeconds={script.loopGapSeconds ?? 2}
              defaultLooping
              onLoopComplete={handleLoopComplete}
              onRegenerate={handleRegenerate}
            />
          ) : null}

          <div className="space-y-3 rounded-md border p-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Regenerate audio</h3>
              <p className="text-xs text-muted-foreground">
                Pick a voice and re-run text-to-speech for this script. Limited
                to 20 audio generations per hour.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="regenerate-voice">Voice</Label>
              {voicesError ? (
                <p className="text-sm text-destructive">
                  Couldn't load voices: {voicesError.message}
                </p>
              ) : (
                <Select
                  value={selectedVoiceId}
                  onValueChange={setSelectedVoiceId}
                  disabled={voicesLoading || generateAudio.isPending}
                >
                  <SelectTrigger id="regenerate-voice" className="sm:max-w-xs">
                    <SelectValue
                      placeholder={
                        voicesLoading ? "Loading voices…" : "Select a voice"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {voices?.map((v) => (
                      <SelectItem key={v.voice_id} value={v.voice_id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleRegenerate}
                disabled={
                  generateAudio.isPending ||
                  voicesLoading ||
                  !!voicesError ||
                  !script.content?.trim()
                }
              >
                {generateAudio.isPending
                  ? "Regenerating…"
                  : script.audioUrl
                    ? "Regenerate audio"
                    : "Generate audio"}
              </Button>
              {selectedVoiceId &&
                script.voiceId &&
                selectedVoiceId !== script.voiceId && (
                  <span className="text-xs text-muted-foreground">
                    Voice will change on regenerate.
                  </span>
                )}
            </div>
          </div>
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
