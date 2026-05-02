import { useRef, useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useDraft } from "@/hooks/useDraft";

import { CharacterCount } from "./editor/CharacterCount";
import {
  DEFAULT_VOICES,
  VoicePicker,
  type VoiceOption,
} from "./editor/VoicePicker";
import {
  mockGenerateAudio,
  type GenerateAudioRequest,
  type GenerateAudioResponse,
} from "./editor/mockGenerateAudio";

const TITLE_MAX = 100;
const BODY_MAX = 2000;
const BODY_WARN_AT = 1900;
const DRAFT_KEY = "new";

const PLACEHOLDER_SCRIPT =
  "Try something like: \"Hi, my name is Jordan and I'm interviewing for the senior engineer role. Over the past five years, I've shipped...\"";

interface ScriptDraft {
  title: string;
  body: string;
  voiceId: string;
}

const INITIAL_DRAFT: ScriptDraft = {
  title: "",
  body: "",
  voiceId: DEFAULT_VOICES[0]?.id ?? "",
};

type RequestStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; result: GenerateAudioResponse }
  | { state: "error"; message: string };

interface ScriptEditorProps {
  voices?: VoiceOption[];
}

export function ScriptEditor({ voices = DEFAULT_VOICES }: ScriptEditorProps) {
  const [draft, setDraft, , draftMeta] = useDraftWithMeta(DRAFT_KEY, INITIAL_DRAFT);

  const [status, setStatus] = useState<RequestStatus>({ state: "idle" });
  const lastRequestRef = useRef<GenerateAudioRequest | null>(null);

  const titleLength = draft.title.length;
  const bodyLength = draft.body.length;
  const isBodyEmpty = draft.body.trim().length === 0;
  const isBodyTooLong = bodyLength > BODY_MAX;
  const isLoading = status.state === "loading";
  const canGenerate = !isBodyEmpty && !isBodyTooLong && !isLoading && !!draft.voiceId;

  const showEmptyState =
    !draftMeta.hasSavedDraft() && isBodyEmpty && !draft.title.trim();

  const handleTitleChange = (value: string) => {
    if (value.length > TITLE_MAX) return;
    setDraft((prev) => ({ ...prev, title: value }));
  };

  const handleBodyChange = (value: string) => {
    setDraft((prev) => ({ ...prev, body: value.slice(0, BODY_MAX) }));
  };

  const handleVoiceChange = (voiceId: string) => {
    setDraft((prev) => ({ ...prev, voiceId }));
  };

  const runGenerate = async (request: GenerateAudioRequest) => {
    lastRequestRef.current = request;
    setStatus({ state: "loading" });
    try {
      // NOTE: At merge time, swap this single line for:
      //   const res = await fetch("/api/generate-audio", { method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify(request) });
      //   if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      //   const result = await res.json();
      const result = await mockGenerateAudio(request);
      setStatus({ state: "success", result });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setStatus({ state: "error", message });
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canGenerate) return;
    void runGenerate({ text: draft.body, voiceId: draft.voiceId });
  };

  const handleRetry = () => {
    if (!lastRequestRef.current || isLoading) return;
    void runGenerate(lastRequestRef.current);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <Card>
        <CardHeader>
          <CardTitle>Write your script</CardTitle>
          <CardDescription>
            Drafts auto-save to this device. Generate audio when you're ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showEmptyState && (
            <Alert className="mb-6">
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Start a new script</AlertTitle>
              <AlertDescription>
                Give it a title and paste or type your script below. We'll save
                it as you go.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="script-title">Title</Label>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {titleLength} / {TITLE_MAX}
                </span>
              </div>
              <Input
                id="script-title"
                value={draft.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Interview pitch v1"
                maxLength={TITLE_MAX}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="script-body">Script</Label>
              <Textarea
                id="script-body"
                value={draft.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder={PLACEHOLDER_SCRIPT}
                maxLength={BODY_MAX}
                className="min-h-[220px] resize-y sm:min-h-[280px]"
              />
              <CharacterCount
                count={bodyLength}
                max={BODY_MAX}
                warnAt={BODY_WARN_AT}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="script-voice">Voice</Label>
              <VoicePicker
                id="script-voice"
                value={draft.voiceId}
                onChange={handleVoiceChange}
                voices={voices}
                disabled={isLoading}
              />
            </div>

            {status.state === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Couldn't generate audio</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>{status.message}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRetry}
                    disabled={isLoading || !lastRequestRef.current}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="submit"
                disabled={!canGenerate}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Spinner className="size-4" />
                    Generating…
                  </>
                ) : (
                  "Generate Audio"
                )}
              </Button>
            </div>
          </form>

          {status.state === "success" && (
            <div className="mt-6 space-y-2 rounded-md border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Preview</p>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {status.result.durationSeconds}s
                </span>
              </div>
              <audio
                key={status.result.audioUrl}
                src={status.result.audioUrl}
                controls
                className="w-full"
                preload="metadata"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function useDraftWithMeta<T>(key: string, initial: T) {
  const result = useDraft<T>(key, initial);
  const [draft, setDraft, clearDraft] = result;
  return [
    draft,
    setDraft,
    clearDraft,
    { hasSavedDraft: result.hasSavedDraft, isDirty: result.isDirty },
  ] as const;
}

export default ScriptEditor;
