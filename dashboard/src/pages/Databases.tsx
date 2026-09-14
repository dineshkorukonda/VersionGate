import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { toast } from "sonner";

export function Databases() {
  const [databases, setDatabases] = useState<ManagedDatabase[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [inspectDb, setInspectDb] = useState<ManagedDatabaseDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
    } catch (err: any) {
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
    } catch (err: any) {
      toast.error("Failed to fetch database details");
    }
  };

  const handleToggleState = async (db: ManagedDatabase) => {
    setActionInProgress(db.id);
    try {
      if (db.running) {
        await stopManagedDatabase(db.id);
        toast.success(`[ OK ] Database ${db.name} stopped`);
      } else {
        await startManagedDatabase(db.id);
        toast.success(`[ OK ] Database ${db.name} started`);
      }
      await load();
    } catch (err: any) {
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
      toast.success(`[ OK ] Database ${db.name} deleted`);
      setDeleteTargetDb(null);
      await load();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : "Failed to delete database");
    } finally {
      setActionInProgress(null);
    }
  };

  const activeCount = databases.filter((d) => d.running).length;
  const postgresCount = databases.filter((d) => d.engine === "postgres").length;
  const redisCount = databases.filter((d) => d.engine === "redis").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Managed Databases"
        description="Provision, monitor, and auto-link isolated server databases (PostgreSQL, Redis, MySQL, MongoDB) directly on the host."
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-emerald-500 font-mono text-xs font-semibold text-black hover:bg-emerald-400"
          >
            + Provision Database
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-neutral-800 bg-neutral-950">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
              Total Instances
            </CardDescription>
            <CardTitle className="font-mono text-2xl text-white">{databases.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-neutral-800 bg-neutral-950">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
              Active / Running
            </CardDescription>
            <CardTitle className="font-mono text-2xl text-emerald-400">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-neutral-800 bg-neutral-950">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
              PostgreSQL
            </CardDescription>
            <CardTitle className="font-mono text-2xl text-white">{postgresCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-neutral-800 bg-neutral-950">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
              Redis Caches
            </CardDescription>
            <CardTitle className="font-mono text-2xl text-white">{redisCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Database Table */}
      <Card className="border-neutral-800 bg-neutral-950">
        <CardHeader className="border-b border-neutral-800/80 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-white">
                Server Databases
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Managed container instances running with persistent Docker volumes.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              className="border-neutral-800 font-mono text-xs text-neutral-400 hover:text-white"
            >
              [ Refresh ]
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center font-mono text-xs text-neutral-500">
              Loading database instances...
            </div>
          ) : databases.length === 0 ? (
            <div className="p-12 text-center">
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                No managed databases provisioned
              </span>
              <p className="mt-2 text-xs text-neutral-400">
                Create your first PostgreSQL or Redis instance to auto-link with your projects.
              </p>
              <Button
                onClick={() => setCreateOpen(true)}
                className="mt-4 bg-emerald-500 font-mono text-xs font-semibold text-black hover:bg-emerald-400"
              >
                + Provision Database
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/40 text-[10px] uppercase text-neutral-400">
                    <th className="px-4 py-3">Instance</th>
                    <th className="px-4 py-3">Engine</th>
                    <th className="px-4 py-3">Host Port</th>
                    <th className="px-4 py-3">Container</th>
                    <th className="px-4 py-3">Linked Project</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {databases.map((db) => {
                    const linkedProj = projects.find((p) => p.id === db.linkedProjectId);
                    return (
                      <tr key={db.id} className="hover:bg-neutral-900/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white">
                          <button
                            type="button"
                            onClick={() => void handleInspect(db.id)}
                            className="hover:text-emerald-400 transition-colors text-left"
                          >
                            {db.name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[10px] uppercase text-neutral-300">
                            {db.engine}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-emerald-400">{db.hostPort}</td>
                        <td className="px-4 py-3 text-neutral-400">{db.containerName}</td>
                        <td className="px-4 py-3">
                          {linkedProj ? (
                            <span className="text-white hover:underline cursor-pointer">
                              {linkedProj.name}
                            </span>
                          ) : (
                            <span className="text-neutral-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`border px-2 py-0.5 text-[10px] uppercase font-semibold ${
                              db.running
                                ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-400"
                                : "border-neutral-700 bg-neutral-900 text-neutral-400"
                            }`}
                          >
                            [{db.running ? "RUNNING" : "STOPPED"}]
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setLinkingDb(db);
                                setLinkModalOpen(true);
                              }}
                              className="text-emerald-400 hover:underline"
                            >
                              {db.linkedProjectId ? "[ Re-link ]" : "[ Link Project ]"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleInspect(db.id)}
                              className="text-neutral-300 hover:underline"
                            >
                              [ Details ]
                            </button>
                            <button
                              type="button"
                              disabled={actionInProgress === db.id}
                              onClick={() => void handleToggleState(db)}
                              className="text-neutral-400 hover:text-white"
                            >
                              {db.running ? "[ Stop ]" : "[ Start ]"}
                            </button>
                            <button
                              type="button"
                              disabled={actionInProgress === db.id}
                              onClick={() => requestDelete(db)}
                              className="text-red-400 hover:underline"
                            >
                              [ Delete ]
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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

      <ConfirmDialog
        open={Boolean(deleteTargetDb)}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetDb(null);
        }}
        title={`Delete database "${deleteTargetDb?.name}"?`}
        description={`This will stop and remove container ${deleteTargetDb?.containerName}. Any running projects connected to this database will lose connection.`}
        checkboxLabel={
          deleteTargetDb
            ? `Permanently delete data volume "${deleteTargetDb.volumeName}" (all stored data will be destroyed)`
            : undefined
        }
        checkboxChecked={dropVolumeChecked}
        onCheckboxChange={setDropVolumeChecked}
        confirmLabel="Delete Database"
        variant="destructive"
        busy={actionInProgress === deleteTargetDb?.id}
        onConfirm={executeDelete}
      />
    </div>
  );
}
