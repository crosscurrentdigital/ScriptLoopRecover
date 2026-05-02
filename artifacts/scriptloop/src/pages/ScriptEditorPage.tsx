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
  useGenerateAudio,
  useScript,
  useUpdateScript,
  useVoices,
} from "@/lib/api";
import type { Script } from "@/db/schema";

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

  const { data: script, isLoading } = useScript(scriptId);

  if (isNew) {
    return <EditorBody mode="create" initial={DEFAULT_DRAFT} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!script) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Script not found.</p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <EditorBody
      mode="edit"
      script={script}
      initial={{
        title: script.title,
        content: script.content,
        loopGapSeconds: script.loopGapSeconds ?? 2,
        voiceId: script.voiceId ?? "",
      }}
    />
  );
}

interface EditorBodyProps {
  mode: "create" | "edit";
  script?: Script;
  initial: DraftShape;
}

function EditorBody({ mode, script, initial }: EditorBodyProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = mode === "create";
  const scriptId = script?.id;

  const { data: voices, isLoading: voicesLoading } = useVoices();
  const createScript = useCreateScript();
  const updateScript = useUpdateScript(scriptId ?? 0);
  const generateAudio = useGenerateAudio(scriptId ?? 0);

  const draftKey = isNew ? "new" : `script-${scriptId}`;
  const { draft, setDraft, clearDraft, hasSavedDraft } = useDraft<DraftShape>({
    key: draftKey,
    initial,
  });

  const [showRestoreNotice, setShowRestoreNotice] = useState(false);
  const noticeChecked = useRef(false);

  useEffect(() => {
    if (noticeChecked.current) return;
    noticeChecked.current = true;
    if (!script) return;
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
    if (!draft.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    try {
      if (isNew) {
        const created = await createScript.mutateAsync({
          title: draft.title,
          content: draft.content,
          loopGapSeconds: draft.loopGapSeconds,
        });
        clearDraft();
        toast({ title: "Script created" });
        navigate(`/scripts/${created.id}`);
      } else if (scriptId) {
        await updateScript.mutateAsync({
          title: draft.title,
          content: draft.content,
          loopGapSeconds: draft.loopGapSeconds,
        });
        clearDraft();
        toast({ title: "Saved" });
      }
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async () => {
    if (!scriptId) {
      toast({ title: "Save the script first", variant: "destructive" });
      return;
    }
    if (!draft.voiceId) {
      toast({ title: "Pick a voice first", variant: "destructive" });
      return;
    }
    if (!draft.content.trim()) {
      toast({ title: "Script content is empty", variant: "destructive" });
      return;
    }
    try {
      await generateAudio.mutateAsync({
        text: draft.content,
        voiceId: draft.voiceId,
      });
      toast({ title: "Audio generated" });
    } catch (e) {
      toast({
        title: "Generation failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">← Back</Link>
            </Button>
            <h1 className="text-lg font-semibold">
              {isNew ? "New script" : "Edit script"}
            </h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={createScript.isPending || updateScript.isPending}
          >
            {createScript.isPending || updateScript.isPending
              ? "Saving…"
              : "Save"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
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
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            placeholder="Paste your script here…"
            className="min-h-[300px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {draft.content.length} characters · drafts auto-save to this device
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audio</CardTitle>
            <CardDescription>
              Generate speech with ElevenLabs and loop it to memorize.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Voice</Label>
              <Select
                value={draft.voiceId}
                onValueChange={(value) =>
                  setDraft((d) => ({ ...d, voiceId: value }))
                }
                disabled={voicesLoading}
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
            </div>

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
              />
              <p className="text-xs text-muted-foreground">
                Pause between each replay.
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateAudio.isPending || isNew}
              variant="secondary"
            >
              {generateAudio.isPending
                ? "Generating audio…"
                : script?.audioUrl
                  ? "Regenerate audio"
                  : "Generate audio"}
            </Button>
            {isNew && (
              <p className="text-xs text-muted-foreground">
                Save the script before generating audio.
              </p>
            )}

            {script?.audioUrl && (
              <LoopPlayer src={script.audioUrl} gapSeconds={draft.loopGapSeconds} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function LoopPlayer({ src, gapSeconds }: { src: string; gapSeconds: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(isLooping);

  useEffect(() => {
    isLoopingRef.current = isLooping;
    if (!isLooping && timer.current !== undefined) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, [isLooping]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (!isLoopingRef.current) return;
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        if (!isLoopingRef.current) return;
        audio.currentTime = 0;
        audio.play().catch(() => {
          /* autoplay may be blocked */
        });
      }, gapSeconds * 1000);
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      if (timer.current !== undefined) {
        window.clearTimeout(timer.current);
        timer.current = undefined;
      }
    };
  }, [gapSeconds]);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <audio
        ref={audioRef}
        src={src}
        controls
        className="w-full"
        preload="metadata"
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isLooping ? "default" : "outline"}
          onClick={() => setIsLooping((v) => !v)}
        >
          {isLooping ? "Looping ✓" : "Loop"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {isLooping
            ? `Will replay with a ${gapSeconds}s gap`
            : "Toggle to auto-replay"}
        </span>
      </div>
    </div>
  );
}
