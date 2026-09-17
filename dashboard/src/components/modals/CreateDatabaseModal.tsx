import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createManagedDatabase, getServerCapacitySpecs, type ManagedDatabase, type Project, type ServerCapacitySpecs } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onCreated: (db: ManagedDatabase) => void;
}

export function CreateDatabaseModal({ open, onOpenChange, projects, onCreated }: Props) {
  const [engine, setEngine] = useState<"postgres" | "mysql" | "redis" | "mongodb">("postgres");
  const [name, setName] = useState("");
  const [databaseName, setDatabaseName] = useState("versiongate_app");
  const [username, setUsername] = useState("postgres");
  const [password, setPassword] = useState("");
  const [linkedProjectId, setLinkedProjectId] = useState<string>("");
  const [memoryLimit, setMemoryLimit] = useState<string>("512m");
  const [cpuLimit, setCpuLimit] = useState<string>("1.0");
  const [specs, setSpecs] = useState<ServerCapacitySpecs | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      void getServerCapacitySpecs()
        .then((data) => {
          setSpecs(data);
          if (data?.recommendations?.database?.memoryLimit) {
            setMemoryLimit(data.recommendations.database.memoryLimit);
          }
          if (data?.recommendations?.database?.cpuLimit) {
            setCpuLimit(data.recommendations.database.cpuLimit);
          }
        })
        .catch(() => {
          // ignore background specs failure
        });
    }
  }, [open]);

  const handleEngineChange = (newEngine: "postgres" | "mysql" | "redis" | "mongodb") => {
    setEngine(newEngine);
    if (newEngine === "postgres") {
      setDatabaseName("versiongate_app");
      setUsername("postgres");
    } else if (newEngine === "mysql") {
      setDatabaseName("versiongate_app");
      setUsername("root");
    } else if (newEngine === "redis") {
      setDatabaseName("");
      setUsername("");
    } else if (newEngine === "mongodb") {
      setDatabaseName("versiongate_app");
      setUsername("admin");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a database instance name");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createManagedDatabase({
        name: name.trim(),
        engine,
        databaseName: databaseName.trim() || undefined,
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        linkedProjectId: linkedProjectId || undefined,
        memoryLimit: memoryLimit || undefined,
        cpuLimit: cpuLimit || undefined,
      });
      toast.success(`[ OK ] Database ${res.database.name} provisioned`);
      onCreated(res.database);
      onOpenChange(false);
      setName("");
      setPassword("");
      setLinkedProjectId("");
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to provision database");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-neutral-800 bg-neutral-950 text-white">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-wider text-emerald-400">
            Provision Managed Server Database
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Deploy an isolated, containerized database instance on the host with persistent storage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Engine Picker */}
          <div className="space-y-1.5">
            <label className="font-mono text-xs text-neutral-300">Database Engine</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "postgres", label: "Postgres" },
                { id: "redis", label: "Redis" },
                { id: "mysql", label: "MySQL" },
                { id: "mongodb", label: "MongoDB" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleEngineChange(item.id as any)}
                  className={`border px-2 py-2 text-center font-mono text-xs uppercase transition-colors ${
                    engine === item.id
                      ? "border-emerald-500 bg-emerald-950/40 text-emerald-400 font-semibold"
                      : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Database Instance Name */}
          <div className="space-y-1.5">
            <label htmlFor="db-name" className="font-mono text-xs text-neutral-300">
              Instance Identifier
            </label>
            <Input
              id="db-name"
              placeholder="e.g. auth-db or cache-redis"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500"
            />
            <p className="text-[11px] text-neutral-500">
              Container will be named <code className="text-neutral-400">vg-db-{name || "name"}</code> with dedicated host port.
            </p>
          </div>

          {/* Database & User (Hidden for Redis) */}
          {engine !== "redis" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="db-database" className="font-mono text-xs text-neutral-300">
                  Database Name
                </label>
                <Input
                  id="db-database"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="db-user" className="font-mono text-xs text-neutral-300">
                  Root Username
                </label>
                <Input
                  id="db-user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Password (Optional, auto-generated if empty) */}
          <div className="space-y-1.5">
            <label htmlFor="db-password" className="font-mono text-xs text-neutral-300">
              Custom Password <span className="text-neutral-500">(Leave empty to auto-generate)</span>
            </label>
            <Input
              id="db-password"
              type="password"
              placeholder="Auto-generated high entropy"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500"
            />
          </div>

          {/* Resource Limits & Server Capacity */}
          <div className="space-y-2 rounded border border-neutral-800/80 bg-neutral-900/40 p-3">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs font-medium text-neutral-300">
                Resource Allocation Guardrails
              </label>
              {specs && (
                <span className="font-mono text-[10px] text-emerald-400">
                  [ HOST: {specs.hardware.cpuCores} CORES | {specs.hardware.totalMemoryGb} GB RAM ]
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="db-memory" className="font-mono text-[11px] text-neutral-400">
                  RAM Limit
                </label>
                <select
                  id="db-memory"
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(e.target.value)}
                  className="w-full border border-neutral-800 bg-neutral-900 px-2 py-1.5 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {specs?.recommendations?.database?.memoryPresetOptions?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} {opt.value === specs.recommendations.database.memoryLimit ? "— Recommended" : ""}
                    </option>
                  )) || (
                    <>
                      <option value="256m">256 MB (Low)</option>
                      <option value="512m">512 MB (Standard)</option>
                      <option value="1g">1 GB (High)</option>
                      <option value="2g">2 GB (Intensive)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="db-cpu" className="font-mono text-[11px] text-neutral-400">
                  CPU Cores
                </label>
                <select
                  id="db-cpu"
                  value={cpuLimit}
                  onChange={(e) => setCpuLimit(e.target.value)}
                  className="w-full border border-neutral-800 bg-neutral-900 px-2 py-1.5 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {specs?.recommendations?.database?.cpuPresetOptions?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} {opt.value === specs.recommendations.database.cpuLimit ? "— Recommended" : ""}
                    </option>
                  )) || (
                    <>
                      <option value="0.5">0.5 Cores</option>
                      <option value="1.0">1.0 Core</option>
                      <option value="2.0">2.0 Cores</option>
                      <option value="4.0">4.0 Cores</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-neutral-500">
              Limits are enforced by Docker cgroups to prevent runaway container queries from starving other host workloads.
            </p>
          </div>

          {/* Auto-link Project */}
          <div className="space-y-1.5">
            <label htmlFor="db-project" className="font-mono text-xs text-neutral-300">
              Auto-Link To Project <span className="text-neutral-500">(Optional)</span>
            </label>
            <select
              id="db-project"
              value={linkedProjectId}
              onChange={(e) => setLinkedProjectId(e.target.value)}
              className="w-full border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Do not link right now</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.deploymentType === "pm2" ? "PM2" : "Docker"})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-neutral-500">
              Will automatically inject <code className="text-neutral-400">{engine === "redis" ? "REDIS_URL" : engine === "mongodb" ? "MONGODB_URL" : "DATABASE_URL"}</code> into project environment variables.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-neutral-800 text-neutral-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-500 font-mono text-xs font-semibold text-black hover:bg-emerald-400"
            >
              {submitting ? "Provisioning..." : "Provision Database"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
