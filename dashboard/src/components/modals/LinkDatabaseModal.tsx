import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkManagedDatabase, type ManagedDatabase, type Project } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: ManagedDatabase | null;
  projects: Project[];
  onLinked: () => void;
}

const DEFAULT_KEYS: Record<string, string> = {
  postgres: "DATABASE_URL",
  mysql: "DATABASE_URL",
  redis: "REDIS_URL",
  mongodb: "MONGODB_URI",
};

export function LinkDatabaseModal({ open, onOpenChange, database, projects, onLinked }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [envKey, setEnvKey] = useState<string>("DATABASE_URL");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (database) {
      setSelectedProjectId(database.linkedProjectId || "");
      setEnvKey(DEFAULT_KEYS[database.engine] || "DATABASE_URL");
    }
  }, [database, open]);

  if (!database) return null;

  const targetProject = projects.find((p) => p.id === selectedProjectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      toast.error("Please select a target project");
      return;
    }

    setLinking(true);
    try {
      const res = await linkManagedDatabase(database.id, selectedProjectId, envKey.trim() || undefined);
      toast.success(`Auto-linked ${res.envKey} to ${targetProject?.name || "project"}`);
      onLinked();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to link database");
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-neutral-800 bg-neutral-950 text-white">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-wider text-emerald-400">
            Link Database // {database.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Attach this database instance to any project. Its connection URI will be injected into encrypted project environment variables.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Database Summary */}
          <div className="border border-neutral-800 bg-neutral-900/50 p-3 font-mono text-xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Engine: <span className="text-white uppercase">{database.engine}</span></span>
              <span>Port: <span className="text-emerald-400 font-semibold">{database.hostPort}</span></span>
            </div>
            <div className="mt-1.5 text-neutral-400">
              Container: <span className="text-neutral-300">{database.containerName}</span>
            </div>
          </div>

          {/* Project Picker */}
          <div className="space-y-1.5">
            <label htmlFor="target-project" className="font-mono text-xs text-neutral-300">
              Target Project
            </label>
            <select
              id="target-project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select project to attach...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.deploymentType === "pm2" ? "Host PM2" : "Docker Container"})
                </option>
              ))}
            </select>
            {targetProject && (
              <p className="font-mono text-[11px] text-neutral-500">
                Connection URI target:{" "}
                <span className="text-emerald-400">
                  {targetProject.deploymentType === "docker" ? "host.docker.internal" : "127.0.0.1"}
                </span>{" "}
                (auto-configured for {targetProject.deploymentType === "docker" ? "Docker" : "PM2"})
              </p>
            )}
          </div>

          {/* Environment Variable Key */}
          <div className="space-y-1.5">
            <label htmlFor="target-env-key" className="font-mono text-xs text-neutral-300">
              Environment Variable Key
            </label>
            <Input
              id="target-env-key"
              value={envKey}
              onChange={(e) => setEnvKey(e.target.value)}
              placeholder="DATABASE_URL"
              className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500"
            />
            <p className="font-mono text-[11px] text-neutral-500">
              The project's code will read this environment variable to connect.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-neutral-800 font-mono text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedProjectId || linking}
              className="bg-emerald-500 font-mono text-xs font-semibold text-black hover:bg-emerald-400"
            >
              {linking ? "Linking..." : "Link Database"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
