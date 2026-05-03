import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Generic typed-confirmation dialog. The destructive action is only
 * enabled once the user types `confirmText` exactly. Used for admin
 * destructive actions where a single click would be too easy.
 */
export function ConfirmTypedDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  actionLabel = "Delete",
  destructive = true,
  onConfirm,
  busy = false,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmText: string;
  actionLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  busy?: boolean;
}) {
  const [value, setValue] = useState("");
  const matches = value === confirmText;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setValue("");
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div>{description}</div>
              <div className="space-y-1">
                <Label htmlFor="confirm-typed">
                  Type{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    {confirmText}
                  </code>{" "}
                  to confirm.
                </Label>
                <Input
                  id="confirm-typed"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (matches) onConfirm();
            }}
            disabled={!matches || busy}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {busy ? "Working…" : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
