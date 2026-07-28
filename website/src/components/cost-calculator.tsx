"use client";

import { useState } from "react";

export function CostCalculator() {
  const [projectCount, setProjectCount] = useState<number>(5);
  const [developerSeats, setDeveloperSeats] = useState<number>(3);

  const vpsMonthlyCost = 10; // $10/mo single Hetzner/DigitalOcean VPS
  const paasPerSeatCost = 40; // $40/seat/mo PaaS Pro
  const paasProjectBase = 20; // $20/project/mo

  const paasMonthlyTotal = developerSeats * paasPerSeatCost + projectCount * paasProjectBase;
  const versionGateMonthlyTotal = vpsMonthlyCost;
  const monthlySavings = paasMonthlyTotal - versionGateMonthlyTotal;
  const yearlySavings = monthlySavings * 12;

  return (
    <div className="rounded border border-zinc-800 bg-[#0a0a0c] p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
            Self-Hosted VPS vs Cloud PaaS Cost Calculator
          </h3>
          <p className="font-mono text-xs text-zinc-400 mt-1">
            Calculate your team's infrastructure savings by running VersionGate on your own server.
          </p>
        </div>
        <span className="rounded bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
          Save ${monthlySavings}/mo
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sliders */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs text-zinc-300">
              <span>Active Deployed Projects:</span>
              <span className="font-bold text-white">{projectCount} Projects</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={projectCount}
              onChange={(e) => setProjectCount(parseInt(e.target.value, 10))}
              className="w-full accent-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs text-zinc-300">
              <span>Developer Team Seats:</span>
              <span className="font-bold text-white">{developerSeats} Seats</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={developerSeats}
              onChange={(e) => setDeveloperSeats(parseInt(e.target.value, 10))}
              className="w-full accent-white"
            />
          </div>
        </div>

        {/* Results Box */}
        <div className="rounded bg-black border border-zinc-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-zinc-900 pb-2">
              <span className="text-zinc-400">Cloud PaaS Estimated Cost:</span>
              <span className="text-red-400 font-bold">${paasMonthlyTotal}/mo</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-2">
              <span className="text-zinc-400">VersionGate Self-Hosted VPS:</span>
              <span className="text-emerald-400 font-bold">${versionGateMonthlyTotal}/mo</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 space-y-1">
            <div className="font-mono text-xs text-zinc-400">Total Annual Savings:</div>
            <div className="font-mono text-3xl font-black text-white">
              ${yearlySavings.toLocaleString()}/yr
            </div>
            <div className="font-mono text-[10px] text-zinc-500">
              100% data ownership, zero per-seat fees, unlimited deployments on your VPS.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
