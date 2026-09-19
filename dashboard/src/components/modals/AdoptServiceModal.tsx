import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adoptServerDeployment, type DiscoveredDeployment } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: DiscoveredDeployment[];
  onAdopted: () => void;
  onRefresh: () => void;
}

export function AdoptServiceModal({
  open,
  onOpenChange,
  candidates,
  onAdopted,
  onRefresh,
}: Props) {
  const [selectedCandidate, setSelectedCandidate] = useState<DiscoveredDeployment | null>(null);
  const [projectName, setProjectName] = useState("");
  const [hostPort, setHostPort] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [buildContext, setBuildContext] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [adopting, setAdopting] = useState(false);

  const handleSelectCandidate = (c: DiscoveredDeployment) => {
    setSelectedCandidate(c);
    setProjectName(c.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"));
    setHostPort(c.port ? String(c.port) : "");
    setRepoUrl(c.repoUrl || "");
    setBranch(c.branch || "main");
    setBuildContext(c.buildContext && c.buildContext !== "." ? c.buildContext : "");
    setCustomDomain(c.detectedDomains && c.detectedDomains.length > 0 ? c.detectedDomains[0] : "");
  };

  const handleAdopt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    const portNum = parseInt(hostPort || String(selectedCandidate.port || 0), 10);
    if (!portNum || portNum < 1 || portNum > 65535) {
      toast.error("Valid host port is required (1-65535)");
      return;
    }

    setAdopting(true);
    try {
      const domainsList = customDomain.trim() ? [customDomain.trim().toLowerCase()] : undefined;
      await adoptServerDeployment({
        name: projectName.trim(),
        serviceType: selectedCandidate.serviceType,
        port: portNum,
        repoUrl: repoUrl.trim() || undefined,
        branch: branch.trim() || "main",
        localPath: selectedCandidate.localPath,
        buildContext: buildContext.trim() || undefined,
        containerName: selectedCandidate.containerName,
        pm2Name: selectedCandidate.pm2Name,
        imageTag: selectedCandidate.imageTag,
        customDomains: domainsList,
      });

      toast.success(`[ OK ] Adopted ${projectName} into VersionGate management`);
      onAdopted();
      onOpenChange(false);
      setSelectedCandidate(null);
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to adopt service");
    } finally {
      setAdopting(false);
    }
  };

  const unmanagedCandidates = candidates.filter((c) => !c.alreadyAdopted);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-neutral-800 bg-neutral-950 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="font-mono text-sm uppercase tracking-wider text-emerald-400">
              Discover & Adopt Server Deployments
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-7 border-neutral-800 font-mono text-[11px] text-neutral-400 hover:text-white"
            >
              [ Rescan Host ]
            </Button>
          </div>
          <DialogDescription className="text-xs text-neutral-400">
            Automatically detect unmanaged PM2 processes and Docker containers running on this server and adopt them into VersionGate control.
          </DialogDescription>
        </DialogHeader>

        {selectedCandidate ? (
          <form onSubmit={handleAdopt} className="space-y-4 pt-2">
            <div className="border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-1">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                Adopting {selectedCandidate.serviceType.toUpperCase()} Instance // {selectedCandidate.name}
              </span>
              <p className="text-[11px] text-neutral-400 font-mono">
                {selectedCandidate.localPath ? `Path: ${selectedCandidate.localPath}` : `Container: ${selectedCandidate.containerName}`}
              </p>
              {selectedCandidate.detectedDomains && selectedCandidate.detectedDomains.length > 0 && (
                <p className="text-[11px] text-sky-400 font-mono">
                  Detected Nginx Domain: {selectedCandidate.detectedDomains.join(", ")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs text-neutral-300">
                  Project Identifier
                </label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. auth-api"
                  className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white focus-visible:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs text-neutral-300">
                  Listening Host Port
                </label>
                {selectedCandidate.port ? (
                  <div className="flex h-9 items-center justify-between rounded-md border border-neutral-800 bg-neutral-900/90 px-3 font-mono text-xs text-emerald-400">
                    <span>{selectedCandidate.port}</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider">[ Auto-Detected ]</span>
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={hostPort}
                    onChange={(e) => setHostPort(e.target.value)}
                    placeholder="e.g. 3000"
                    className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white focus-visible:ring-emerald-500"
                    required
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="block font-mono text-xs text-neutral-300">
                  Git Repository URL <span className="text-neutral-500">(Optional)</span>
                </label>
                <Input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs text-neutral-300">
                  Branch
                </label>
                <Input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block font-mono text-xs text-neutral-300">
                  Build Context / Monorepo Subfolder <span className="text-neutral-500">(Optional)</span>
                </label>
                <Input
                  value={buildContext}
                  onChange={(e) => setBuildContext(e.target.value)}
                  placeholder="e.g. apps/dashboard or core-api"
                  className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-xs text-neutral-300">
                  Custom Domain <span className="text-neutral-500">(Optional / Auto-detected)</span>
                </label>
                <Input
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g. api.example.com"
                  className="border-neutral-800 bg-neutral-900 font-mono text-xs text-white focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-neutral-500">
              Adoption registers this service as a managed VersionGate project, routes production traffic through Nginx, and brings it under zero-downtime monitoring.
            </p>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedCandidate(null)}
                className="border-neutral-800 text-neutral-400 hover:text-white"
              >
                [ Back to List ]
              </Button>
              <Button
                type="submit"
                disabled={adopting}
                className="bg-emerald-500 font-mono text-xs font-semibold text-black hover:bg-emerald-400"
              >
                {adopting ? "Adopting..." : "Confirm & Adopt Service"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            {unmanagedCandidates.length === 0 ? (
              <div className="border border-dashed border-neutral-800 p-8 text-center">
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                  No unmanaged server services detected
                </span>
                <p className="mt-2 text-xs text-neutral-400">
                  All active PM2 processes and Docker containers are already managed in VersionGate or internal.
                </p>
              </div>
            ) : (
              <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
                {unmanagedCandidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between border border-neutral-800 bg-neutral-900/50 p-3 hover:border-neutral-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-white">
                          {c.name}
                        </span>
                        <span className="border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 font-mono text-[9px] uppercase text-neutral-300">
                          {c.serviceType}
                        </span>
                        <span
                          className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase font-semibold ${
                            c.status === "online" || c.status === "running"
                              ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-400"
                              : "border-neutral-700 bg-neutral-900 text-neutral-400"
                          }`}
                        >
                          [{c.status}]
                        </span>
                        {c.detectedDomains && c.detectedDomains.length > 0 && (
                          <span className="border border-sky-500/40 bg-sky-950/40 px-1.5 py-0.5 font-mono text-[9px] text-sky-400">
                            {c.detectedDomains[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
                        {c.port && <span>Port: <strong className="text-emerald-400">{c.port}</strong></span>}
                        {c.localPath && <span className="truncate max-w-xs">{c.localPath}</span>}
                        {c.imageTag && <span className="truncate max-w-xs">{c.imageTag}</span>}
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleSelectCandidate(c)}
                      className="bg-emerald-500 font-mono text-xs font-semibold text-black hover:bg-emerald-400"
                    >
                      [ Adopt ]
                    </Button>
                  </div>
                ))}
              </div>
            )}

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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

