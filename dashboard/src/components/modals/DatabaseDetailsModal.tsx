import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { linkManagedDatabase, type ManagedDatabaseDetails, type Project } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: ManagedDatabaseDetails | null;
  projects: Project[];
  onUpdated: () => void;
}

export function DatabaseDetailsModal({ open, onOpenChange, database, projects, onUpdated }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [linking, setLinking] = useState(false);

  if (!database) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`[ COPIED ] ${label}`);
  };

  const handleLink = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a target project");
      return;
    }

    setLinking(true);
    try {
      const res = await linkManagedDatabase(database.id, selectedProjectId);
      toast.success(`[ OK ] Auto-linked ${res.envKey} to project`);
      onUpdated();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to link database");
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-neutral-800 bg-neutral-950 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="font-mono text-sm uppercase tracking-wider text-emerald-400">
              Database Connection // {database.name}
            </DialogTitle>
            <span
              className={`border px-2 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                database.running
                  ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-400"
                  : "border-neutral-700 bg-neutral-900 text-neutral-400"
              }`}
            >
              [{database.running ? "RUNNING" : "STOPPED"}]
            </span>
          </div>
          <DialogDescription className="text-xs text-neutral-400">
            Engine: <span className="font-mono text-white uppercase">{database.engine} ({database.version})</span> | Port:{" "}
            <span className="font-mono text-white">{database.hostPort}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Credentials Grid */}
          <div className="grid grid-cols-2 gap-3 border border-neutral-800 bg-neutral-900/50 p-3">
            <div>
              <span className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Container
              </span>
              <span className="font-mono text-xs text-neutral-300">{database.containerName}</span>
            </div>
            <div>
              <span className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Host Port
              </span>
              <span className="font-mono text-xs text-emerald-400 font-semibold">{database.hostPort}</span>
            </div>
            {database.databaseName && (
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  Database Name
                </span>
                <span className="font-mono text-xs text-neutral-300">{database.databaseName}</span>
              </div>
            )}
            {database.username && (
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  Username
                </span>
                <span className="font-mono text-xs text-neutral-300">{database.username}</span>
              </div>
            )}
            <div className="col-span-2 flex items-center justify-between border-t border-neutral-800/80 pt-2">
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  Password
                </span>
                <span className="font-mono text-xs text-neutral-300">
                  {showPassword ? database.passwordDecrypted : "••••••••••••••••••••••••"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-7 border-neutral-800 font-mono text-[11px] text-neutral-400 hover:text-white"
                >
                  {showPassword ? "[ Hide ]" : "[ Reveal ]"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(database.passwordDecrypted, "Password")}
                  className="h-7 border-neutral-800 font-mono text-[11px] text-emerald-400 hover:text-emerald-300"
                >
                  [ Copy ]
                </Button>
              </div>
            </div>
          </div>

          {/* Connection URIs */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                  Local / Host Connection URI (For Host PM2 & CLI)
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(database.connectionUriLocal, "Local Connection URI")}
                  className="font-mono text-[11px] text-emerald-400 hover:underline"
                >
                  [ Copy URI ]
                </button>
              </div>
              <div className="overflow-x-auto border border-neutral-800 bg-neutral-900 p-2.5 font-mono text-xs text-neutral-300">
                <code>{database.connectionUriLocal}</code>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                  Docker Container URI (For Dockerized Apps)
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(database.connectionUriDocker, "Docker Connection URI")}
                  className="font-mono text-[11px] text-emerald-400 hover:underline"
                >
                  [ Copy URI ]
                </button>
              </div>
              <div className="overflow-x-auto border border-neutral-800 bg-neutral-900 p-2.5 font-mono text-xs text-neutral-300">
                <code>{database.connectionUriDocker}</code>
              </div>
            </div>
          </div>

          {/* Auto-Link To Project Section */}
          <div className="border border-neutral-800 bg-neutral-900/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="block font-mono text-xs uppercase tracking-wider text-neutral-300 font-semibold">
                Auto-Link To Project Environment
              </span>
              {database.linkedProjectId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={linking}
                  onClick={async () => {
                    setLinking(true);
                    try {
                      const { unlinkManagedDatabase } = await import("@/lib/api");
                      await unlinkManagedDatabase(database.id);
                      toast.success("[ OK ] Unlinked database from project");
                      onUpdated();
                    } catch (err: any) {
                      toast.error(err instanceof Error ? err.message : "Failed to unlink");
                    } finally {
                      setLinking(false);
                    }
                  }}
                  className="h-6 border-neutral-800 font-mono text-[10px] text-neutral-400 hover:text-red-400"
                >
                  [ Unlink ]
                </Button>
              )}
            </div>
            <p className="text-[11px] text-neutral-500">
              Injects the connection URI directly into the target project's encrypted environment variables.
            </p>
            <div className="flex gap-2">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="flex-1 border border-neutral-800 bg-neutral-900 px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.deploymentType === "pm2" ? "PM2" : "Docker"})
                  </option>
                ))}
              </select>
              <Button
                type="button"
                disabled={!selectedProjectId || linking}
                onClick={handleLink}
                className="bg-emerald-500 font-mono text-xs font-semibold text-black hover:bg-emerald-400"
              >
                {linking ? "Linking..." : database.linkedProjectId ? "Change Link" : "Link Now"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-neutral-800 text-neutral-400 hover:text-white"
          >
            [ Close ]
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
