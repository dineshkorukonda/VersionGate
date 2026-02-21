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

// Recharts is loaded only in the browser to avoid SSR/static-export issues
// with its dependency on browser globals.
export function MetricsChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <ChartSkeleton label="Loading charts..." />;
  }

  if (data.length === 0) {
    return <ChartSkeleton label="Waiting for metrics — polls every 30s" />;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } = require("recharts");

  const tooltipStyle = {
    contentStyle: {
      background: "#18181b",
      border: "1px solid #3f3f46",
      borderRadius: 6,
      fontSize: 11,
    },
    labelStyle: { color: "#a1a1aa" },
  };

  const tickProps = {
    tick: { fontSize: 10, fill: "#71717a" },
    tickLine: false,
    axisLine: false,
  };

  return (
    <div className="space-y-6">
      {/* CPU */}
      <div>
        <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">CPU %</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data} margin={{ top: 2, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="time" {...tickProps} />
            <YAxis {...tickProps} domain={[0, 100]} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`, "CPU"]} />
            <Line
              type="monotone" dataKey="cpu" stroke="#60a5fa"
              strokeWidth={1.5} dot={false} isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Memory */}
      <div>
        <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Memory (MB)</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data} margin={{ top: 2, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="time" {...tickProps} />
            <YAxis {...tickProps} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)} MB`, "Memory"]} />
            <Line
              type="monotone" dataKey="memoryMB" stroke="#a78bfa"
              strokeWidth={1.5} dot={false} isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Network I/O */}
      <div>
        <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Network I/O (KB)</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data} margin={{ top: 2, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="time" {...tickProps} />
            <YAxis {...tickProps} />
            <Tooltip
              {...tooltipStyle}
              formatter={(v: number, name: string) => [
                `${v.toFixed(1)} KB`,
                name === "netInKB" ? "RX (in)" : "TX (out)",
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, color: "#71717a", paddingTop: 4 }}
              formatter={(value: string) => value === "netInKB" ? "RX (in)" : "TX (out)"}
            />
            <Line
              type="monotone" dataKey="netInKB" stroke="#34d399"
              strokeWidth={1.5} dot={false} isAnimationActive={false}
            />
            <Line
              type="monotone" dataKey="netOutKB" stroke="#f97316"
              strokeWidth={1.5} dot={false} isAnimationActive={false}
              strokeDasharray="4 2"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-6">
      {["CPU %", "Memory (MB)", "Network I/O (KB)"].map((title) => (
        <div key={title}>
          <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">{title}</p>
          <div className="h-[120px] bg-zinc-800/40 rounded-lg flex items-center justify-center">
            <span className="text-xs text-zinc-600">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
