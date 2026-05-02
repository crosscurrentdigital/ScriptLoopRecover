import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import type { Script } from "@/db/schema";

interface ScriptCardProps {
  script: Script;
  voiceName?: string;
  onDelete: (id: number, title: string) => void;
  isDeleting?: boolean;
}

function previewContent(content: string) {
  const trimmed = (content ?? "").trim();
  if (trimmed.length === 0) return "(empty)";
  if (trimmed.length <= 80) return trimmed;
  return trimmed.slice(0, 80) + "…";
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ScriptCard({
  script,
  voiceName,
  onDelete,
  isDeleting,
}: ScriptCardProps) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const displayVoice = voiceName ?? script.voiceId ?? "No voice";

  const goToScript = () => navigate(`/scripts/${script.id}`);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToScript();
    }
  };

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={`Open ${script.title}`}
      onClick={goToScript}
      onKeyDown={handleKeyDown}
      className="flex flex-col cursor-pointer transition-shadow active:shadow-md active:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:hover:shadow-md sm:hover:border-primary/40"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">
            {script.title || "Untitled"}
          </CardTitle>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete ${script.title}`}
                disabled={isDeleting}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                className="h-11 w-11 text-muted-foreground active:text-destructive sm:h-8 sm:w-8 sm:hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this script?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{script.title || "Untitled"}" will be permanently deleted.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(script.id, script.title)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <CardDescription className="line-clamp-3">
          {previewContent(script.content)}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-2 pt-0">
        <span className="text-xs text-muted-foreground truncate">
          {displayVoice}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatDate(script.createdAt)}
        </span>
      </CardContent>
    </Card>
  );
}
