"use client";

import { useState } from "react";

export interface QuestionThread {
  id: string;
  category: "Docker" | "Nginx" | "API Tokens" | "Rollbacks" | "Troubleshooting";
  title: string;
  author: string;
  date: string;
  upvotes: number;
  question: string;
  answer: string;
  accepted: boolean;
  codeSnippet?: string;
}

const THREADS: QuestionThread[] = [
  {
    id: "thread-1",
    category: "Nginx",
    title: "How does VersionGate switch traffic atomically without dropping active requests?",
    author: "dinesh_k",
    date: "2 days ago",
    upvotes: 42,
    question: "When deploying a new version to the green container slot on port 3101, how does VersionGate avoid dropping HTTP requests currently hitting the blue slot on port 3100?",
    answer: "VersionGate generates an updated Nginx upstream configuration file mapping the project's upstream name to 127.0.0.1:3101. It runs `nginx -s reload` (or SIGHUP), which instructs Nginx to spawn new worker processes for new incoming connections while allowing old worker processes to finish serving existing in-flight connections gracefully.",
    accepted: true,
    codeSnippet: "# Nginx upstream reload execution\nversiongate traffic switch --port 3101 --upstream versiongate_api-backend\n# Reloads Nginx gracefully without closing active socket connections",
  },
  {
    id: "thread-2",
    category: "Rollbacks",
    title: "Why is the warm-swap rollback under 2 seconds?",
    author: "alex_dev",
    date: "3 days ago",
    upvotes: 38,
    question: "When I trigger a rollback to a previous deployment version, why is it so much faster than a fresh deployment?",
    answer: "VersionGate warm-swap checks if the Docker container or local Docker image tag (e.g. `versiongate-my-app:v13`) already exists on the VPS host. If present, it skips git cloning, dependency installation, and Docker build context compilation, directly executing `docker run` on the cached image and verifying health immediately.",
    accepted: true,
    codeSnippet: "// Warm-swap check in src/services/rollback.service.ts\nconst isCached = await imageExists(previous.imageTag);\nif (isCached) {\n  await runContainer(previous.containerName, previous.imageTag, ...);\n}",
  },
  {
    id: "thread-3",
    category: "API Tokens",
    title: "How do I authenticate GitHub Actions to trigger deployments without logging in?",
    author: "devops_sam",
    date: "5 days ago",
    upvotes: 29,
    question: "I want to trigger VersionGate deployments from a GitHub Actions workflow on PR merge. How do I generate and use API tokens?",
    answer: "Navigate to Dashboard → Settings → API Access Tokens and click 'Generate Token'. Copy the raw token (`vg_live_...`). In your GitHub repository secrets, add `VERSIONGATE_API_TOKEN`. Pass it in the HTTP header: `Authorization: Bearer vg_live_...`.",
    accepted: true,
    codeSnippet: "# GitHub Actions Step\n- name: Trigger VersionGate Deploy\n  run: |\n    curl -X POST https://your-server.com/api/v1/deploy \\\n      -H \"Authorization: Bearer ${{ secrets.VERSIONGATE_API_TOKEN }}\" \\\n      -d '{\"projectId\":\"proj_123\",\"environmentId\":\"env_prod\"}'",
  },
  {
    id: "thread-4",
    category: "Docker",
    title: "What happens if a newly deployed container crashes on startup?",
    author: "marcus_b",
    date: "1 week ago",
    upvotes: 24,
    question: "If I deploy a broken code change that causes Node/Python to crash-loop on container launch, does VersionGate tear down my working production app?",
    answer: "No. Live traffic remains 100% connected to the active blue slot container. VersionGate runs an internal health validation check against `http://127.0.0.1:<idle_port><healthPath>`. If the health check fails or times out, the deployment job is marked `FAILED`, the broken green container is stopped and removed, and Nginx traffic is never switched.",
    accepted: true,
    codeSnippet: "[ FAIL ] Health check failed: http://127.0.0.1:3101/health returned 500 Internal Server Error\n[ INFO ] Deployment aborted. Active traffic remains safely connected to port 3100.",
  },
  {
    id: "thread-5",
    category: "Troubleshooting",
    title: "How to resolve 'port already allocated' errors on manual container restarts?",
    author: "chen_wei",
    date: "1 week ago",
    upvotes: 19,
    question: "I get a Docker port allocation error when attempting to force restart a container bound to port 3100. How does VersionGate handle port collisions?",
    answer: "VersionGate includes a `freeHostPort(port)` utility function that queries `docker ps -q --filter publish=PORT` and force-removes any leftover orphan containers occupying that port before attempting to bind new containers.",
    accepted: true,
    codeSnippet: "await freeHostPort(hostPort);\n// Kills and cleans up any orphaned containers bound to hostPort prior to docker run",
  },
];

export function CommunityQnA() {
  const [threads, setThreads] = useState<QuestionThread[]>(THREADS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Docker", "Nginx", "API Tokens", "Rollbacks", "Troubleshooting"];

  const handleUpvote = (id: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, upvotes: t.upvotes + 1 } : t))
    );
  };

  const filtered = threads.filter((t) => {
    const matchesCat = selectedCategory === "All" || t.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === "" ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 font-mono text-xs rounded transition ${
                selectedCategory === cat
                  ? "bg-white text-black font-bold"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Q&A knowledge base..."
          className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 font-mono text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 sm:w-64"
        />
      </div>

      {/* Threads List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-zinc-500 rounded border border-zinc-800 bg-[#0a0a0c]">
            No Q&A threads found matching "{searchQuery}".
          </div>
        ) : (
          filtered.map((thread) => (
            <div
              key={thread.id}
              className="rounded border border-zinc-800 bg-[#0a0a0c] p-6 space-y-4 transition hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-[9px] text-zinc-400 border border-zinc-800 font-bold">
                      {thread.category}
                    </span>
                    {thread.accepted && (
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] text-emerald-400 border border-emerald-500/30 font-bold">
                        [ ACCEPTED SOLUTION ]
                      </span>
                    )}
                  </div>
                  <h3 className="font-mono text-sm font-bold text-white pt-1">
                    {thread.title}
                  </h3>
                  <div className="font-mono text-[10px] text-zinc-500">
                    Asked by <span className="text-zinc-400">{thread.author}</span> · {thread.date}
                  </div>
                </div>

                {/* Upvote Button */}
                <button
                  onClick={() => handleUpvote(thread.id)}
                  className="flex flex-col items-center justify-center rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-400 hover:text-white hover:border-zinc-600 transition min-w-[50px]"
                >
                  <span className="font-mono text-[10px] text-zinc-500">▲</span>
                  <span className="font-mono text-xs font-bold text-white">{thread.upvotes}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="font-mono text-xs text-zinc-300 leading-relaxed border-l-2 border-zinc-800 pl-3">
                {thread.question}
              </div>

              {/* Solution Answer Box */}
              <div className="rounded bg-black border border-zinc-800/80 p-4 space-y-3">
                <div className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Verified Engine Solution:
                </div>
                <p className="font-mono text-xs text-zinc-300 leading-relaxed">
                  {thread.answer}
                </p>
                {thread.codeSnippet && (
                  <pre className="overflow-x-auto p-3 bg-[#050506] border border-zinc-800 font-mono text-xs text-zinc-300 rounded">
                    {thread.codeSnippet}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
