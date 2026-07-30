import { useCallback, useEffect, useRef, useState } from "react";
import { applySelfUpdateFromSettings, getSelfUpdateSettings } from "@/lib/api";
import { toast } from "sonner";
import { X } from "lucide-react";

const POLL_MS = 120_000;
const DISMISS_KEY = "vg-update-banner-dismissed";
const TOAST_PREFIX = "vg-update-toast-remote-";

/**
 * Slim update banner that appears when the server clone is behind origin.
 * Applies silently via pm2 reload --update-env (graceful, zero-downtime).
 * No window.confirm() dialog — update is applied immediately on click.
 */
export function UpdateAvailableBanner() {
  const [show, setShow] = useState(false);
  const [branch, setBranch] = useState("");
  const [applying, setApplying] = useState(false);
  const dismissedRef = useRef(sessionStorage.getItem(DISMISS_KEY) === "1");

  const poll = useCallback(async () => {
    try {
      const su = await getSelfUpdateSettings();
      if (!su.configured || !su.git?.isGitRepo || su.git.message) {
        setShow(false);
        return;
      }
      const behind = su.git.behind;
      const remote = su.git.remoteCommit ?? "";

      setBranch(su.branch);

      if (!behind) {
        sessionStorage.removeItem(DISMISS_KEY);
        dismissedRef.current = false;
        setShow(false);
        return;
      }

      const toastKey = remote ? `${TOAST_PREFIX}${remote.slice(0, 40)}` : "";
      if (toastKey && !sessionStorage.getItem(toastKey)) {
        sessionStorage.setItem(toastKey, "1");
        toast.info("Update available", {
          description: `New commits detected on ${su.branch}. Apply from the banner above.`,
          duration: 8_000,
        });
      }

      setShow(!dismissedRef.current);
    } catch {
      setShow(false);
    }
  }, []);

  useEffect(() => {
    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => window.clearInterval(id);
  }, [poll]);

  const onDismiss = () => {
    dismissedRef.current = true;
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  const onApply = async () => {
    setApplying(true);
    const tid = toast.loading("Applying update — the server will reload gracefully...");
    try {
      const r = await applySelfUpdateFromSettings();
      toast.dismiss(tid);
      if (r.ok) {
        toast.success("Update applied. Reconnecting...", { duration: 4_000 });
        setShow(false);
        // Auto-reconnect: poll API until it responds again after reload
        let attempts = 0;
        const reconnect = window.setInterval(async () => {
          attempts++;
          try {
            const res = await fetch("/api/v1/setup/status");
            if (res.ok) {
              window.clearInterval(reconnect);
              window.location.reload();
            }
          } catch {
            // server still reloading
          }
          if (attempts > 30) {
            window.clearInterval(reconnect);
            window.location.reload();
          }
        }, 2000);
      } else {
        toast.error(r.error ?? "Update failed", {
          description: r.steps?.length ? r.steps.slice(-3).join(" > ") : undefined,
        });
      }
    } catch (e) {
      toast.dismiss(tid);
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setApplying(false);
    }
  };

  if (!show) return null;

  return (
    <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#111] px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="inline-block h-2 w-2 rounded-full bg-[#0070f3]" />
        <span className="text-sm text-[#a1a1a1]">
          Update available on{" "}
          <span className="font-medium text-white">origin/{branch}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={applying}
          onClick={() => void onApply()}
          className="rounded-md bg-white px-3 py-1 text-xs font-medium text-black transition-colors hover:bg-zinc-100 disabled:opacity-50"
        >
          {applying ? "Applying..." : "Apply update"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 text-[#737373] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
