import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useDraft } from "@/hooks/useDraft";
import {
  useCreateScript,
  useCreateScriptWithAudio,
  useScript,
  useUpdateScript,
  useVoices,
} from "@/lib/api";
import { uploadToR2 } from "@/lib/r2";
import { AudioQuotaBadge } from "@/components/AudioQuotaBadge";
import {
  AudioPrivacyConsent,
  hasAudioPrivacyAck,
} from "@/components/AudioPrivacyConsent";
import {
  VoiceRecorder,
  type RecordedAudio,
} from "@/components/VoiceRecorder";
import type { Script } from "@/db/schema";

type AudioMode = "ai" | "record";

const MAX_CONTENT_LENGTH = 2000;

interface DraftShape {
  title: string;
  content: string;
  loopGapSeconds: number;
  voiceId: string;
}

const DEFAULT_DRAFT: DraftShape = {
  title: "",
  content: "",
  loopGapSeconds: 2,
  voiceId: "",
};

export default function ScriptEditorPage() {
  const params = useParams();
  const isNew = !params.id;
  const scriptId = params.id ? Number(params.id) : undefined;

  const { data: script, isLoading, error, refetch, isFetching } =
    useScript(scriptId);

  if (isNew) {
    return <CreateEditor />;
  }

  if (isLoading) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">
        Loading script…
      </main>
    );
  }

  if (error || !script) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base">
              {error ? "Couldn't load script" : "Script not found"}
            </CardTitle>
            {error && (
              <CardDescription className="text-destructive">
                {error.message}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {error && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? "Retrying…" : "Try again"}
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <EditExistingEditor script={script} />;
}

function CreateEditor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data: voices,
    isLoading: voicesLoading,
    error: voicesError,
    refetch: refetchVoices,
    isFetching: voicesFetching,
  } = useVoices();
  const createWithAudio = useCreateScriptWithAudio();
  const createScript = useCreateScript();
  const [audioPrivacyAck, setAudioPrivacyAck] = useState<boolean>(
    () => hasAudioPrivacyAck(),
  );

  const [audioMode, setAudioMode] = useState<AudioMode>("ai");
  const [recorded, setRecorded] = useState<RecordedAudio | null>(null);
  const [uploading, setUploading] = useState(false);

  const { draft, setDraft, clearDraft } = useDraft<DraftShape>({
    key: "new",
    initial: DEFAULT_DRAFT,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSubmitting =
    createWithAudio.isPending || createScript.isPending || uploading;

  const handleGenerateAndSave = async () => {
    setSubmitError(null);

    if (!draft.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!draft.content.trim()) {
      toast({ title: "Script content is empty", variant: "destructive" });
      return;
    }
    if (draft.content.length > MAX_CONTENT_LENGTH) {
      toast({
        title: "Script is too long",
        description: `Scripts are limited to ${MAX_CONTENT_LENGTH} characters.`,
        variant: "destructive",
      });
      return;
    }
    if (!audioPrivacyAck) {
      toast({
        title: "Confirm audio privacy first",
        description:
          "Please acknowledge that audio is hosted at a public, hard-to-guess URL.",
        variant: "destructive",
      });
      return;
    }

    if (audioMode === "record") {
      if (!recorded) {
        toast({
          title: "Record yourself first",
          description: "Capture a take, then tap “Use this recording”.",
          variant: "destructive",
        });
        return;
      }
      try {
        setUploading(true);
        // Upload to R2 first via presigned PUT, then create the row in
        // one shot. If the create call fails the R2 object is orphaned
        // — that's the same trade-off the AI path makes in reverse and
        // the cost is bounded by MAX_RECORDING_BYTES.
        const fileName = `recording-${Date.now()}.${recorded.extension}`;
        const { url } = await uploadToR2(
          recorded.blob,
          fileName,
          recorded.mimeType,
        );
        const created = await createScript.mutateAsync({
          title: draft.title.trim(),
          content: draft.content,
          loopGapSeconds: draft.loopGapSeconds,
          audioUrl: url,
          audioSource: "user",
        });
        clearDraft();
        toast({ title: "Script created" });
        navigate(`/scripts/${created.id}`);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Something went wrong.";
        setSubmitError(message);
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!draft.voiceId) {
      toast({ title: "Pick a voice first", variant: "destructive" });
      return;
    }

    try {
      // Single atomic call: server generates audio first and inserts the
      // row only on success, so a failure here leaves nothing to clean up.
      const created = await createWithAudio.mutateAsync({
        title: draft.title.trim(),
        content: draft.content,
        loopGapSeconds: draft.loopGapSeconds,
        voiceId: draft.voiceId,
      });
      clearDraft();
      toast({ title: "Script created" });
      navigate(`/scripts/${created.id}`);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Something went wrong.";
      setSubmitError(message);
    }
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">New script</h1>
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">Cancel</Link>
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="My monologue"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Script</Label>
        <Textarea
          id="content"
          value={draft.content}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              content: e.target.value.slice(0, MAX_CONTENT_LENGTH),
            }))
          }
          maxLength={MAX_CONTENT_LENGTH}
          placeholder="Paste your script here…"
          className="min-h-[300px] font-mono text-base sm:text-sm"
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Drafts auto-save to this device
          </p>
          <p
            className={`text-xs tabular-nums ${
              draft.content.length >= MAX_CONTENT_LENGTH
                ? "text-destructive font-medium"
                : draft.content.length >= MAX_CONTENT_LENGTH - 200
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
            }`}
          >
            {draft.content.length} / {MAX_CONTENT_LENGTH}
          </p>
        </div>
        {draft.content.length >= MAX_CONTENT_LENGTH && (
          <p className="text-xs text-destructive">
            You've reached the {MAX_CONTENT_LENGTH}-character limit. Trim your
            script to continue.
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audio</CardTitle>
          <CardDescription>
            Pick an AI voice or record yourself. You can swap or
            re-record later from the script's detail page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="inline-flex rounded-md border p-0.5"
            role="tablist"
            aria-label="Audio source"
          >
            <Button
              type="button"
              size="sm"
              variant={audioMode === "ai" ? "default" : "ghost"}
              onClick={() => setAudioMode("ai")}
              disabled={isSubmitting}
              role="tab"
              aria-selected={audioMode === "ai"}
            >
              AI voice
            </Button>
            <Button
              type="button"
              size="sm"
              variant={audioMode === "record" ? "default" : "ghost"}
              onClick={() => setAudioMode("record")}
              disabled={isSubmitting}
              role="tab"
              aria-selected={audioMode === "record"}
            >
              Record yourself
            </Button>
          </div>

          {audioMode === "record" ? (
            <VoiceRecorder
              onAccept={(audio) => setRecorded(audio)}
              disabled={isSubmitting}
            />
          ) : (
          <div className="space-y-2">
            <Label>Voice</Label>
            {voicesError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
                <p className="text-destructive">
                  Couldn't load voices: {voicesError.message}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => refetchVoices()}
                  disabled={voicesFetching}
                >
                  {voicesFetching ? "Retrying…" : "Try again"}
                </Button>
              </div>
            ) : (
              <Select
                value={draft.voiceId}
                onValueChange={(value) =>
                  setDraft((d) => ({ ...d, voiceId: value }))
                }
                disabled={voicesLoading || isSubmitting}
              >
                <SelectTrigger>
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
          )}

          <div className="space-y-2">
            <Label>Loop gap: {draft.loopGapSeconds}s</Label>
            <Slider
              value={[draft.loopGapSeconds]}
              min={0}
              max={10}
              step={1}
              onValueChange={(value) =>
                setDraft((d) => ({ ...d, loopGapSeconds: value[0] ?? 2 }))
              }
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Pause between each replay.
            </p>
          </div>
        </CardContent>
      </Card>

      {submitError && (
        <Card className="border-destructive">
          <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-sm text-destructive flex-1">{submitError}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateAndSave}
              disabled={isSubmitting}
              className="shrink-0"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <AudioPrivacyConsent onChange={setAudioPrivacyAck} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <AudioQuotaBadge className="text-center sm:mr-auto sm:text-left" />
        <Button
          onClick={handleGenerateAndSave}
          disabled={
            isSubmitting ||
            draft.content.length > MAX_CONTENT_LENGTH ||
            !audioPrivacyAck
          }
          size="lg"
          className="w-full sm:w-auto"
        >
          {isSubmitting
            ? audioMode === "record"
              ? uploading
                ? "Uploading recording…"
                : "Saving…"
              : "Generating audio…"
            : audioMode === "record"
              ? "Save with recording"
              : "Generate & Save"}
        </Button>
      </div>
    </main>
  );
}

function EditExistingEditor({ script }: { script: Script }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const updateScript = useUpdateScript(script.id);
  const { data: voices } = useVoices();

  const initial: DraftShape = {
    title: script.title,
    content: script.content,
    loopGapSeconds: script.loopGapSeconds ?? 2,
    voiceId: script.voiceId ?? "",
  };

  const { draft, setDraft, clearDraft, hasSavedDraft } = useDraft<DraftShape>({
    key: `script-${script.id}`,
    initial,
  });

  const [showRestoreNotice, setShowRestoreNotice] = useState(false);
  const noticeChecked = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (noticeChecked.current) return;
    noticeChecked.current = true;
    const saved = hasSavedDraft();
    const differs =
      saved &&
      (draft.title !== script.title || draft.content !== script.content);
    if (differs) setShowRestoreNotice(true);
  }, [script, draft, hasSavedDraft]);

  const discardDraft = () => {
    clearDraft();
    setShowRestoreNotice(false);
  };

  const handleSave = async () => {
    setSubmitError(null);
    if (!draft.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (draft.content.length > MAX_CONTENT_LENGTH) {
      toast({
        title: "Script is too long",
        description: `Scripts are limited to ${MAX_CONTENT_LENGTH} characters.`,
        variant: "destructive",
      });
      return;
    }
    try {
      await updateScript.mutateAsync({
        title: draft.title.trim(),
        content: draft.content,
      });
      clearDraft();
      toast({ title: "Saved" });
      navigate(`/scripts/${script.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed";
      setSubmitError(message);
      toast({
        title: "Couldn't save",
        description: message,
        variant: "destructive",
      });
    }
  };

  const voiceName =
    voices?.find((v) => v.voice_id === script.voiceId)?.name ??
    script.voiceId ??
    "—";

  return (
    <main className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Edit script</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/scripts/${script.id}`}>Cancel</Link>
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              updateScript.isPending ||
              draft.content.length > MAX_CONTENT_LENGTH
            }
          >
            {updateScript.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {showRestoreNotice && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4 flex items-center justify-between gap-4">
            <p className="text-sm">
              Restored an unsaved draft from this device.
            </p>
            <Button size="sm" variant="outline" onClick={discardDraft}>
              Discard draft
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="My monologue"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Script</Label>
        <Textarea
          id="content"
          value={draft.content}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              content: e.target.value.slice(0, MAX_CONTENT_LENGTH),
            }))
          }
          maxLength={MAX_CONTENT_LENGTH}
          placeholder="Paste your script here…"
          className="min-h-[300px] font-mono text-base sm:text-sm"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Drafts auto-save to this device
          </p>
          <p
            className={`text-xs tabular-nums ${
              draft.content.length >= MAX_CONTENT_LENGTH
                ? "text-destructive font-medium"
                : draft.content.length >= MAX_CONTENT_LENGTH - 200
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
            }`}
          >
            {draft.content.length} / {MAX_CONTENT_LENGTH}
          </p>
        </div>
        {draft.content.length >= MAX_CONTENT_LENGTH && (
          <p className="text-xs text-destructive">
            You've reached the {MAX_CONTENT_LENGTH}-character limit. Trim your
            script to continue.
          </p>
        )}
        {submitError && (
          <p className="text-xs text-destructive">{submitError}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audio</CardTitle>
          <CardDescription>
            To swap the voice or regenerate audio, head to the{" "}
            <Link
              to={`/scripts/${script.id}`}
              className="underline underline-offset-2"
            >
              script's detail page
            </Link>
            . Loop gap can't be changed after creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Voice</dt>
            <dd>{voiceName}</dd>
            <dt className="text-muted-foreground">Loop gap</dt>
            <dd>{script.loopGapSeconds ?? 2}s</dd>
            <dt className="text-muted-foreground">Audio</dt>
            <dd>
              {script.audioUrl ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Ready
                </span>
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </dd>
          </dl>
          {script.audioUrl && (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Audio URL (read-only)
                </Label>
                <Input
                  value={script.audioUrl}
                  readOnly
                  onFocus={(e) => e.currentTarget.select()}
                  className="font-mono text-base sm:text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Audio preview (read-only)
                </Label>
                <audio
                  src={script.audioUrl}
                  controls
                  preload="metadata"
                  className="w-full"
                />
              </div>
              <div className="pt-1">
                <Link
                  to={`/scripts/${script.id}/zen`}
                  className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-2 sm:min-h-0 sm:text-xs sm:no-underline sm:hover:underline"
                >
                  Enter Zen Mode →
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {submitError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{submitError}</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
