"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Project, Deployment } from "@/lib/api";
import { api } from "@/lib/api";
import { StatusBadge, RunningDot } from "./StatusBadge";
import { ConfirmModal } from "./ConfirmModal";

interface Props {
  project: Project;
  activeDeployment: Deployment | undefined;
  onDeleted: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ProjectCard({ project, activeDeployment, onDeleted }: Props) {
  const router = useRouter();
  const isRunning = activeDeployment?.status === "ACTIVE";
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleteOpen(false);
    setDeleting(true);
    try {
      await api.projects.delete(project.id);
      toast.success(`"${project.name}" deleted`);
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="group relative bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 transition-all">
        {/* Clickable area */}
        <Link href={`/projects/${project.id}/`} className="block p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0 pr-2">
              <h2 className="font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
                {project.name}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">{project.repoUrl}</p>
            </div>
            <RunningDot running={isRunning} />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Status</span>
              {activeDeployment
                ? <StatusBadge status={activeDeployment.status} />
                : <span className="text-xs text-zinc-600">No deployments</span>}
            </div>

            {activeDeployment && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Slot</span>
                  <span className={`text-xs font-semibold font-mono ${activeDeployment.color === "BLUE" ? "text-blue-400" : "text-indigo-400"}`}>
                    {activeDeployment.color} :{activeDeployment.port}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Version</span>
                  <span className="text-xs text-zinc-400 font-mono">v{activeDeployment.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Last deploy</span>
                  <span className="text-xs text-zinc-400">{timeAgo(activeDeployment.updatedAt)}</span>
                </div>
              </>
            )}
          </div>
        </Link>

        {/* Delete button — bottom strip */}
        <div className="border-t border-zinc-800 px-5 py-2.5 flex justify-end">
          <button
            onClick={(e) => { e.preventDefault(); setDeleteOpen(true); }}
            disabled={deleting}
            className="text-xs text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        title={`Delete "${project.name}"?`}
        description="This will permanently delete the project and all deployment records. Running containers will not be stopped."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
