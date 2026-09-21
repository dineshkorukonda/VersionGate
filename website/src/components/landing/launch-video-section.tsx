"use client";

import { useRef, useState, useEffect } from "react";

const HIGHLIGHTS = [
  {
    tag: "01 // ATOMIC SWAP & ROLLBACK",
    title: "Zero-Downtime Blue/Green",
    desc: "Spawns idle container, runs HTTP health probes, switches Nginx upstreams with zero dropped packets, and provides < 2s warm rollbacks.",
  },
  {
    tag: "02 // RUNTIMES & PM2",
    title: "Docker & PM2 Host Processes",
    desc: "Auto-detects Bun, pnpm, Python (uv/poetry), Rust (Cargo), Go, and PHP. Supports containerized and bare-metal supervision.",
  },
  {
    tag: "03 // PROXY & SSL",
    title: "Dynamic Nginx & Certbot TLS",
    desc: "Automated upstream rewrites, stage preview routing (/p/:project/:env), and preflight DNS IPv4 validation.",
  },
  {
    tag: "04 // DB STUDIO & CONSOLE",
    title: "Managed PostgreSQL, Redis & Mongo",
    desc: "1-click provisioning with persistent volumes, interactive query console, and instant project linking.",
  },
  {
    tag: "05 // TELEMETRY & SYNC",
    title: "Status Plane & Auto-Deploy Validator",
    desc: "Real-time subsystem health monitoring, live stdout/stderr logs, and commit-driven auto-deployment synchronization.",
  },
];

export function LaunchVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration, setDuration] = useState("00:20");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      video.pause();
      video.removeAttribute("autoplay");
    } else {
      void video.play().catch(() => {
        /* autoplay may be blocked until user interaction */
      });
    }

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        const mins = Math.floor(video.currentTime / 60);
        const secs = Math.floor(video.currentTime % 60);
        setCurrentTime(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    };

    const handleLoadedMetadata = () => {
      if (video.duration) {
        const mins = Math.floor(video.duration / 60);
        const secs = Math.floor(video.duration % 60);
        setDuration(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const clickPos = value / 100;
    video.currentTime = clickPos * video.duration;
  };

  const copyBragCmd = () => {
    navigator.clipboard.writeText("npx skills add https://github.com/latent-spaces/brag --skill brag");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="demo-video" className="border-t border-neutral-800 bg-[#070707] py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-mono text-primary uppercase tracking-wider">
              <span>[ LAUNCH SHOWCASE ]</span>
              <span className="text-neutral-500">·</span>
              <span>20s TEASER</span>
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              See VersionGate in Action
            </h2>
            <p className="mt-2 text-sm text-neutral-400 max-w-2xl">
              Engineered for developer speed and server autonomy. Watch the complete zero-downtime deployment flow rendered directly from the codebase.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={copyBragCmd}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 font-mono text-xs text-neutral-300 transition hover:border-neutral-700 hover:text-white"
            >
              <span>[ RUN /BRAG ]</span>
              <span className="text-neutral-500">{copied ? "COPIED" : "COPY CMD"}</span>
            </button>
            <span aria-live="polite" className="sr-only">
              {copied ? "Command copied to clipboard" : ""}
            </span>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Main Video Frame */}
          <div className="lg:col-span-8">
            <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-black shadow-2xl shadow-black/80 group">
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-neutral-800/80 bg-neutral-950/80 px-4 py-2.5 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-xs text-neutral-300 uppercase tracking-wider">
                    VERSIONGATE // LAUNCH_REEL.MP4
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-neutral-500">
                  <span>{currentTime}</span>
                  <span>/</span>
                  <span>{duration}</span>
                </div>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video w-full bg-neutral-950 flex items-center justify-center">
                <video
                  ref={videoRef}
                  src="/assets/versiongate-launch.mp4"
                  poster="/assets/versiongate-poster.jpg"
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                  onClick={togglePlay}
                />

                {/* Center Play Overlay when Paused */}
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 transition hover:bg-black/20"
                    aria-label="Play video"
                  >
                    <div className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-900/90 px-5 py-3 font-mono text-sm font-medium text-white shadow-xl backdrop-blur transition hover:border-primary hover:text-primary">
                      <span>[ PLAY VIDEO ]</span>
                      <span className="text-xs text-neutral-400">20s</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Video Timeline Scrubber */}
              <label htmlFor="launch-video-progress" className="sr-only">
                Video progress
              </label>
              <input
                id="launch-video-progress"
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label="Video progress"
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none bg-neutral-800 accent-primary transition-all hover:h-2.5"
              />

              {/* Interactive Control Footer */}
              <div className="flex items-center justify-between border-t border-neutral-800/80 bg-neutral-950/90 px-4 py-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="rounded border border-neutral-800 bg-neutral-900 px-3 py-1 text-neutral-300 transition hover:border-neutral-700 hover:text-white"
                  >
                    {isPlaying ? "[ PAUSE ]" : "[ PLAY ]"}
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="rounded border border-neutral-800 bg-neutral-900 px-3 py-1 text-neutral-300 transition hover:border-neutral-700 hover:text-white"
                  >
                    {isMuted ? "[ UNMUTE ]" : "[ MUTED ]"}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-neutral-400">
                  <span className="hidden sm:inline text-neutral-500">CODEBASE TO LAUNCH VIDEO</span>
                  <span className="rounded border border-neutral-800 bg-neutral-900/60 px-2 py-0.5 text-neutral-400">
                    POWERED BY /BRAG + HYPERFRAMES
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Highlight Cards */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.tag}
                className="rounded-xl border border-neutral-800 bg-[#0c0c0c] p-5 transition hover:border-neutral-700"
              >
                <span className="font-mono text-xs text-primary">{item.tag}</span>
                <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-400">{item.desc}</p>
              </div>
            ))}

            <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950/60 p-5 font-mono text-xs">
              <span className="text-neutral-500">// AUTOMATE RELEASE TEASERS</span>
              <p className="mt-2 text-neutral-400">
                Run <code className="text-primary font-bold">/brag</code> in your terminal or Claude Code / Antigravity session to re-render fresh launch videos on every release.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
