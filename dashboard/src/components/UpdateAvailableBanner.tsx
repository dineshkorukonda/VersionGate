import { useCallback, useEffect, useRef, useState } from "react";
import { getSelfUpdateSettings } from "@/lib/api";
import { SystemUpdateModal } from "@/components/modals/SystemUpdateModal";

const POLL_MS = 120_000;
const DISMISS_KEY = "vg-update-banner-dismissed";

/**
 * Slim update banner that notifies when remote origin is ahead.
 * Clicking "Inspect & Apply" opens the interactive SystemUpdateModal for
 * safe, non-blocking zero-downtime execution with live streaming logs.
 */
export function UpdateAvailableBanner() {
  const [show, setShow] = useState(false);
  const [branch, setBranch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const dismissedRef = useRef(sessionStorage.getItem(DISMISS_KEY) === "1");

  const poll = useCallback(async () => {
    try {
      const su = await getSelfUpdateSettings();
      if (!su.configured || !su.git?.isGitRepo || su.git.message) {
        setShow(false);
        return;
      }
      const behind = su.git.behind;
      setBranch(su.branch);

      if (!behind) {
        sessionStorage.removeItem(DISMISS_KEY);
        dismissedRef.current = false;
        setShow(false);
        return;
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

  if (!show) return null;

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-card/90 px-4 py-2 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-muted-foreground">
            New updates available on <span className="font-semibold text-foreground">origin/{branch}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded bg-primary px-3 py-1 font-mono text-xs font-semibold text-primary-foreground transition-colors hover:brightness-110"
          >
            [ Inspect & Apply ]
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded px-1.5 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            [ X ]
          </button>
        </div>
      </div>

      <SystemUpdateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        branch={branch}
        onComplete={() => {
          setShow(false);
          dismissedRef.current = true;
        }}
      />
    </>
  );
}
