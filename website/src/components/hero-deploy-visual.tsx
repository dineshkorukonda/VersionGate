"use client";

import { useEffect, useState } from "react";

const LOG_LINES = [
  "[ INFO ] Job #4912 enqueued · web-app / production",
  "[ INFO ] Idle slot GREEN :3101 selected",
  "[ OK ] Health check 200 · 14ms",
  "[ OK ] Nginx upstream rewrite · 0 ms downtime",
  "[ LIVE ] Traffic on GREEN · BLUE warm for rollback",
] as const;

export function HeroDeployVisual() {
  const [phase, setPhase] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState(1);
  const [activeSlot, setActiveSlot] = useState<"BLUE" | "GREEN">("BLUE");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setPhase(0);
      setVisibleLogs(1);
      setActiveSlot("BLUE");

      timers.push(
        setTimeout(() => {
          setPhase(1);
          setVisibleLogs(2);
        }, 900),
        setTimeout(() => {
          setPhase(2);
          setVisibleLogs(3);
        }, 1800),
        setTimeout(() => {
          setPhase(3);
          setVisibleLogs(4);
          setActiveSlot("GREEN");
        }, 2700),
        setTimeout(() => {
          setPhase(4);
          setVisibleLogs(5);
        }, 3600),
        setTimeout(run, 6200),
      );
    };

    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative h-full min-h-[88vh] w-full overflow-hidden lg:min-h-[92vh]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_42%,rgba(34,87,231,0.34),transparent_52%),radial-gradient(ellipse_at_15%_85%,rgba(34,87,231,0.12),transparent_40%),linear-gradient(180deg,#06080f_0%,#0a1020_55%,#06080f_100%)]" />
      <div className="absolute inset-0 opacity-[0.3] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_75%_45%,black_10%,transparent_70%)]" />

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] lg:block">
        <div className="absolute left-[8%] top-[22%] right-[10%] landing-fade-up">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7aa2ff]">
                Control plane
              </p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-white">
                Blue / Green slots
              </p>
            </div>
            <p className="font-mono text-[11px] text-white/40">web-app · production</p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <SlotPlane
              name="BLUE"
              port=":3100"
              active={activeSlot === "BLUE"}
              role={activeSlot === "BLUE" ? "ACTIVE" : "WARM"}
            />
            <SlotPlane
              name="GREEN"
              port=":3101"
              active={activeSlot === "GREEN"}
              role={activeSlot === "GREEN" ? "ACTIVE" : phase >= 1 ? "BUILDING" : "IDLE"}
              building={phase >= 1 && phase < 3 && activeSlot !== "GREEN"}
            />
          </div>

          <div className="relative mt-6 h-12 overflow-hidden border border-white/10 bg-black/30">
            <div
              className={`absolute inset-y-0 w-1/2 bg-[#2257e7]/25 transition-all duration-700 ease-out ${
                activeSlot === "GREEN" ? "left-1/2" : "left-0"
              }`}
            />
            <div
              className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#9db7ff] shadow-[0_0_24px_rgba(125,162,255,0.9)] transition-all duration-700 ease-out ${
                activeSlot === "GREEN" ? "left-[72%]" : "left-[22%]"
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-medium tracking-[0.14em] text-white/80">
              UPSTREAM → {activeSlot} · 0 MS DOWNTIME
            </div>
          </div>

          <div className="mt-6 space-y-1.5 border-t border-white/10 pt-5 font-mono text-[12px] leading-relaxed text-white/65">
            {LOG_LINES.slice(0, visibleLogs).map((line) => (
              <p key={line} className="landing-log-line">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile / tablet compact strip */}
      <div className="absolute inset-x-0 bottom-0 p-4 lg:hidden">
        <div className="border border-white/10 bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#7aa2ff]">
            <span>Upstream</span>
            <span>{activeSlot}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className={`border px-3 py-2 ${activeSlot === "BLUE" ? "border-[#2257e7] bg-[#2257e7]/20" : "border-white/10"}`}>
              <p className="font-mono text-[11px] text-white">BLUE</p>
            </div>
            <div className={`border px-3 py-2 ${activeSlot === "GREEN" ? "border-[#2257e7] bg-[#2257e7]/20" : "border-white/10"}`}>
              <p className="font-mono text-[11px] text-white">GREEN</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotPlane({
  name,
  port,
  active,
  role,
  building = false,
}: {
  name: string;
  port: string;
  active: boolean;
  role: string;
  building?: boolean;
}) {
  return (
    <div
      className={`border p-5 transition-all duration-500 ${
        active
          ? "border-[#2257e7]/80 bg-[#2257e7]/15"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-xl font-semibold tracking-tight text-white">{name}</span>
        <span
          className={`font-mono text-[10px] tracking-[0.12em] ${
            active ? "text-[#9db7ff]" : building ? "text-amber-200/80" : "text-white/35"
          }`}
        >
          {role}
        </span>
      </div>
      <p className="mt-3 font-mono text-sm text-white/45">{port}</p>
      <div className="mt-5 h-px w-full bg-white/10">
        <div
          className={`h-px transition-all duration-700 ${
            active ? "w-full bg-[#7aa2ff]" : building ? "w-2/3 animate-pulse bg-[#2257e7]/80" : "w-1/5 bg-white/25"
          }`}
        />
      </div>
    </div>
  );
}
