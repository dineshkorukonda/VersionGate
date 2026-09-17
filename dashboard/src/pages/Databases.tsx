import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  listManagedDatabases,
  getManagedDatabase,
  startManagedDatabase,
  stopManagedDatabase,
  deleteManagedDatabase,
  getProjects,
  type ManagedDatabase,
  type ManagedDatabaseDetails,
  type Project,
} from "@/lib/api";
import { CreateDatabaseModal } from "@/components/modals/CreateDatabaseModal";
import { DatabaseDetailsModal } from "@/components/modals/DatabaseDetailsModal";
import { LinkDatabaseModal } from "@/components/modals/LinkDatabaseModal";
import { DatabaseStudioModal } from "@/components/modals/DatabaseStudioModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Databases() {
  const [databases, setDatabases] = useState<ManagedDatabase[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [inspectDb, setInspectDb] = useState<ManagedDatabaseDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [studioDb, setStudioDb] = useState<ManagedDatabase | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkingDb, setLinkingDb] = useState<ManagedDatabase | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [deleteTargetDb, setDeleteTargetDb] = useState<ManagedDatabase | null>(null);
  const [dropVolumeChecked, setDropVolumeChecked] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [dbRes, projRes] = await Promise.all([
        listManagedDatabases(),
        getProjects(),
      ]);
      setDatabases(dbRes.databases);
      setProjects(projRes.projects);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load databases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleInspect = async (id: string) => {
    try {
      const res = await getManagedDatabase(id);
      setInspectDb(res.database);
      setDetailsOpen(true);
    } catch {
      toast.error("Failed to fetch database details");
    }
  };

  const handleToggleState = async (db: ManagedDatabase) => {
    setActionInProgress(db.id);
    try {
      if (db.running) {
        await stopManagedDatabase(db.id);
        toast.success(`Database ${db.name} stopped`);
      } else {
        await startManagedDatabase(db.id);
        toast.success(`Database ${db.name} started`);
      }
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle database state");
    } finally {
      setActionInProgress(null);
    }
  };

  const requestDelete = (db: ManagedDatabase) => {
    setDeleteTargetDb(db);
    setDropVolumeChecked(false);
  };

  const executeDelete = async () => {
    if (!deleteTargetDb) return;
    const db = deleteTargetDb;
    setActionInProgress(db.id);
    try {
      await deleteManagedDatabase(db.id, dropVolumeChecked);
      toast.success(`Database ${db.name} deleted`);
      setDeleteTargetDb(null);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete database");
    } finally {
      setActionInProgress(null);
    }
  };

  const activeCount = databases.filter((d) => d.running).length;
  const postgresCount = databases.filter((d) => d.engine === "postgres").length;
  const redisCount = databases.filter((d) => d.engine === "redis").length;

  return (
    <div className="space-y-6 font-sans">
      {/* Vercel Header Bar */}
      <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Storage & Databases
          </h1>
          <p className="text-xs text-neutral-400">
            Provision, monitor, and auto-link isolated databases directly on host container networks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            className="border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white text-xs h-8"
          >
            Refresh
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8"
          >
            + Create Database
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-4">
          <span className="text-xs font-medium text-neutral-500">Total Instances</span>
          <p className="mt-1 font-mono text-2xl font-bold text-white">{databases.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-4">
          <span className="text-xs font-medium text-emerald-400">Active / Running</span>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-4">
          <span className="text-xs font-medium text-neutral-500">PostgreSQL</span>
          <p className="mt-1 font-mono text-2xl font-bold text-white">{postgresCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-4">
          <span className="text-xs font-medium text-neutral-500">Redis Caches</span>
          <p className="mt-1 font-mono text-2xl font-bold text-white">{redisCount}</p>
        </div>
      </div>

      {/* Database Table Card */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0a0a0a]">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Database Instances</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Managed container instances running with persistent host-backed Docker volumes.
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            {databases.length} {databases.length === 1 ? "instance" : "instances"}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            Loading database instances...
          </div>
        ) : databases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-medium text-white">No managed databases provisioned</p>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Create your first PostgreSQL or Redis instance to auto-link connection strings directly to your project environments.
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              className="bg-white text-black font-semibold hover:bg-neutral-200 text-xs h-8"
            >
              + Create Database
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500">
                  <th className="px-6 py-3 font-medium">Instance</th>
                  <th className="px-4 py-3 font-medium">Engine</th>
                  <th className="px-4 py-3 font-medium">Host Port</th>
                  <th className="px-4 py-3 font-medium">Container</th>
                  <th className="px-4 py-3 font-medium">Linked Project</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {databases.map((db) => {
                  const linkedProj = projects.find((p) => p.id === db.linkedProjectId);
                  return (
                    <tr key={db.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-white">
                        <button
                          type="button"
                          onClick={() => void handleInspect(db.id)}
                          className="hover:underline text-left font-semibold text-white"
                        >
                          {db.name}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[11px] uppercase text-neutral-300">
                          {db.engine}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-neutral-300">:{db.hostPort}</td>
                      <td className="px-4 py-3.5 font-mono text-neutral-400">{db.containerName}</td>
                      <td className="px-4 py-3.5">
                        {linkedProj ? (
                          <span className="text-white hover:underline cursor-pointer">
                            {linkedProj.name}
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border",
                            db.running
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-neutral-800 bg-neutral-900 text-neutral-400"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full shrink-0",
                              db.running ? "bg-emerald-500" : "bg-neutral-600"
                            )}
                          />
                          {db.running ? "Running" : "Stopped"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-neutral-800 text-neutral-300 hover:text-white"
                            onClick={() => {
                              setStudioDb(db);
                              setStudioOpen(true);
                            }}
                          >
                            Studio
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-neutral-800 text-neutral-300 hover:text-white"
                            onClick={() => {
                              setLinkingDb(db);
                              setLinkModalOpen(true);
                            }}
                          >
                            {db.linkedProjectId ? "Re-link" : "Link"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-neutral-800 text-neutral-300 hover:text-white"
                            onClick={() => void handleInspect(db.id)}
                          >
                            Details
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={actionInProgress === db.id}
                            onClick={() => void handleToggleState(db)}
                            className="h-7 text-xs border-neutral-800 text-neutral-300 hover:text-white"
                          >
                            {db.running ? "Stop" : "Start"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={actionInProgress === db.id}
                            onClick={() => requestDelete(db)}
                            className="h-7 text-xs border-red-900/40 text-red-400 hover:bg-red-950/20"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-neutral-800 bg-black px-6 py-3 text-xs text-neutral-500">
          Database volumes are persisted at <code className="font-mono text-neutral-400">/var/lib/docker/volumes</code>
        </div>
      </div>

      {/* Modals */}
      <CreateDatabaseModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        projects={projects}
        onCreated={() => void load()}
      />

      <DatabaseDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        database={inspectDb}
        projects={projects}
        onUpdated={() => {
          void load();
          if (inspectDb) void handleInspect(inspectDb.id);
        }}
      />

      <LinkDatabaseModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        database={linkingDb}
        projects={projects}
        onLinked={() => void load()}
      />

      <DatabaseStudioModal
        open={studioOpen}
        onOpenChange={setStudioOpen}
        database={studioDb}
      />

      <ConfirmDialog
        open={Boolean(deleteTargetDb)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetDb(null);
        }}
        title={`Delete Database "${deleteTargetDb?.name}"?`}
        description={
          <div className="space-y-3 pt-1">
            <p className="text-xs text-neutral-400">
              Are you sure you want to delete this database? All active connections will be severed immediately.
            </p>
            <label className="flex items-center gap-2 text-xs text-red-400 cursor-pointer">
              <input
                type="checkbox"
                checked={dropVolumeChecked}
                onChange={(e) => setDropVolumeChecked(e.target.checked)}
                className="rounded border-neutral-800 bg-black"
              />
              <span>Also permanently purge Docker storage volume (Data loss!)</span>
            </label>
          </div>
        }
        confirmLabel={dropVolumeChecked ? "Destroy Database & Volume" : "Delete Database"}
        variant="destructive"
        onConfirm={() => void executeDelete()}
      />
    </div>
  );
}
