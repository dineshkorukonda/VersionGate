"use client";
import { useState, useEffect } from "react";

export interface MetricSample {
  time: string;
  cpu: number;
  memoryPercent: number;
  memoryMB: number;
  netInKB: number;
  netOutKB: number;
}

interface Props {
  data: MetricSample[];
}

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-6">
      {["CPU %", "Memory (MB)", "Network I/O (KB)"].map((title) => (
        <div key={title}>
          <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">{title}</p>
          <div className="h-[140px] bg-zinc-800/40 rounded-lg flex flex-col items-center justify-center gap-2">
            <span className="text-xs text-zinc-600">{label}</span>
            {label.startsWith("Collecting") && (
              <span className="text-[10px] text-zinc-700">Chart will appear once 2+ samples are collected</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MetricsChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <ChartSkeleton label="Loading charts…" />;
  if (data.length === 0) return <ChartSkeleton label="Waiting for metrics — polls every 30s" />;
  if (data.length < 2) return <ChartSkeleton label="Collecting data — 1 sample so far…" />;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RC = require("recharts");

  const tooltip = {
    contentStyle: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, fontSize: 11 },
    labelStyle: { color: "#a1a1aa" },
  };
  const axis = { tick: { fontSize: 10, fill: "#71717a" }, tickLine: false, axisLine: false };

  return (
    <div className="space-y-8">
      {/* CPU */}
      <div>
        <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">CPU %</p>
        <RC.ResponsiveContainer width="100%" height={150}>
          <RC.AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gCpuPrj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <RC.CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <RC.XAxis dataKey="time" {...axis} />
            <RC.YAxis {...axis} domain={[0, 100]} />
            <RC.Tooltip {...tooltip} formatter={(v: number) => [`${v.toFixed(2)}%`, "CPU"]} />
            <RC.Area
              type="monotone" dataKey="cpu"
              stroke="#60a5fa" strokeWidth={2}
              fill="url(#gCpuPrj)" dot={false} isAnimationActive={false}
            />
          </RC.AreaChart>
        </RC.ResponsiveContainer>
      </div>

      {/* Memory */}
      <div>
        <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">Memory (MB)</p>
        <RC.ResponsiveContainer width="100%" height={150}>
          <RC.AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gMemPrj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <RC.CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <RC.XAxis dataKey="time" {...axis} />
            <RC.YAxis {...axis} />
            <RC.Tooltip {...tooltip} formatter={(v: number) => [`${v.toFixed(1)} MB`, "Memory"]} />
            <RC.Area
              type="monotone" dataKey="memoryMB"
              stroke="#a78bfa" strokeWidth={2}
              fill="url(#gMemPrj)" dot={false} isAnimationActive={false}
            />
          </RC.AreaChart>
        </RC.ResponsiveContainer>
      </div>

      {/* Network I/O */}
      <div>
        <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">Network I/O (KB)</p>
        <RC.ResponsiveContainer width="100%" height={150}>
          <RC.AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gNetInPrj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gNetOutPrj" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <RC.CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <RC.XAxis dataKey="time" {...axis} />
            <RC.YAxis {...axis} />
            <RC.Tooltip
              {...tooltip}
              formatter={(v: number, name: string) => [
                `${v.toFixed(1)} KB`,
                name === "netInKB" ? "RX (in)" : "TX (out)",
              ]}
            />
            <RC.Legend
              wrapperStyle={{ fontSize: 10, color: "#71717a", paddingTop: 6 }}
              formatter={(value: string) => value === "netInKB" ? "RX (in)" : "TX (out)"}
            />
            <RC.Area
              type="monotone" dataKey="netInKB"
              stroke="#818cf8" strokeWidth={2}
              fill="url(#gNetInPrj)" dot={false} isAnimationActive={false}
            />
            <RC.Area
              type="monotone" dataKey="netOutKB"
              stroke="#f97316" strokeWidth={2}
              fill="url(#gNetOutPrj)" dot={false} isAnimationActive={false}
              strokeDasharray="4 2"
            />
          </RC.AreaChart>
        </RC.ResponsiveContainer>
      </div>
    </div>
  );
}
