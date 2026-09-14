import { type ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  busy?: boolean;
  onConfirm: () => Promise<void> | void;
  checkboxLabel?: string;
  checkboxChecked?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  busy = false,
  onConfirm,
  checkboxLabel,
  checkboxChecked = false,
  onCheckboxChange,
}: ConfirmDialogProps) {
  const [internalBusy, setInternalBusy] = useState(false);
  const isBusy = busy || internalBusy;

  const handleConfirm = async () => {
    setInternalBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setInternalBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isBusy && onOpenChange(next)}>
      <DialogContent showCloseButton={!isBusy} className="sm:max-w-md border-neutral-800 bg-[#0a0a0a] text-white">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base font-semibold text-white">{title}</DialogTitle>
          <DialogDescription className="text-xs text-neutral-400 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {checkboxLabel ? (
          <label className="flex items-center gap-2 pt-2 text-xs text-neutral-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checkboxChecked}
              onChange={(e) => onCheckboxChange?.(e.target.checked)}
              disabled={isBusy}
              className="rounded border-neutral-700 bg-neutral-900 text-rose-500 focus:ring-rose-500/20"
            />
            <span>{checkboxLabel}</span>
          </label>
        ) : null}

        <DialogFooter className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-900 text-xs"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            size="sm"
            disabled={isBusy}
            onClick={() => void handleConfirm()}
            className={
              variant === "destructive"
                ? "bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
                : "bg-white text-black hover:bg-neutral-200 text-xs font-medium"
            }
          >
            {isBusy ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
