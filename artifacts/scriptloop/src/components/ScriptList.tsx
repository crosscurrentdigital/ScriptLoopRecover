import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { ScriptCard } from "@/components/ScriptCard";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useVoices } from "@/lib/api";
import type { Script } from "@/db/schema";

interface ScriptListProps {
  scripts: Script[];
  onDelete: (id: number, title: string) => void;
  deletingId?: number | null;
}

export function ScriptList({ scripts, onDelete, deletingId }: ScriptListProps) {
  const { data: voices } = useVoices();
  const voiceNameById = useMemo(() => {
    const map = new Map<string, string>();
    voices?.forEach((v) => map.set(v.voice_id, v.name));
    return map;
  }, [voices]);

  if (scripts.length === 0) {
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No scripts yet</EmptyTitle>
          <EmptyDescription>
            Add your first script and ScriptLoop will turn it into audio you can
            loop until you've memorized it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/scripts/new">
              <Plus className="h-4 w-4" />
              Create your first script
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {scripts.map((script) => (
        <ScriptCard
          key={script.id}
          script={script}
          voiceName={
            script.voiceId ? voiceNameById.get(script.voiceId) : undefined
          }
          onDelete={onDelete}
          isDeleting={deletingId === script.id}
        />
      ))}
    </div>
  );
}
