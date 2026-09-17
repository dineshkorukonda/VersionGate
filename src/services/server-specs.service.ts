import os from "os";
import { logger } from "../utils/logger";

export interface ServerCapacitySpecs {
  hardware: {
    cpuCores: number;
    cpuModel: string;
    totalMemoryBytes: number;
    totalMemoryMb: number;
    totalMemoryGb: number;
    freeMemoryMb: number;
    loadAverage: [number, number, number];
    platform: string;
    arch: string;
  };
  recommendations: {
    database: {
      memoryLimit: string;
      cpuLimit: string;
      memoryPresetOptions: { label: string; value: string; isRecommended?: boolean }[];
      cpuPresetOptions: { label: string; value: string; isRecommended?: boolean }[];
    };
    cron: {
      maxConcurrentJobs: number;
      defaultTimeoutSeconds: number;
      recommendedTimeoutCeiling: number;
    };
    container: {
      maxRecommendedRunningContainers: number;
      defaultMemoryLimit: string;
    };
  };
}

export class ServerSpecsService {
  getServerCapacity(): ServerCapacitySpecs {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpus = os.cpus();
    const cpuCores = cpus.length || 1;
    const cpuModel = cpus[0]?.model || "Generic CPU";
    const totalMemMb = Math.round(totalMem / (1024 * 1024));
    const totalMemGb = Number((totalMem / (1024 * 1024 * 1024)).toFixed(1));
    const freeMemMb = Math.round(freeMem / (1024 * 1024));

    // Dynamic Database Memory Recommendation
    let defaultDbMemory = "512m";
    if (totalMemGb <= 2) {
      defaultDbMemory = "256m";
    } else if (totalMemGb <= 4) {
      defaultDbMemory = "512m";
    } else if (totalMemGb <= 8) {
      defaultDbMemory = "1g";
    } else {
      defaultDbMemory = "2g";
    }

    // Dynamic CPU Allocation Recommendation
    let defaultDbCpu = "1.0";
    if (cpuCores <= 1) {
      defaultDbCpu = "0.5";
    } else if (cpuCores <= 2) {
      defaultDbCpu = "1.0";
    } else if (cpuCores <= 4) {
      defaultDbCpu = "2.0";
    } else {
      defaultDbCpu = "4.0";
    }

    // Memory Presets
    const memoryPresetOptions = [
      { label: "128 MB (Minimal)", value: "128m", isRecommended: totalMemGb <= 1 },
      { label: "256 MB (Low)", value: "256m", isRecommended: totalMemGb > 1 && totalMemGb <= 2 },
      { label: "512 MB (Standard)", value: "512m", isRecommended: totalMemGb > 2 && totalMemGb <= 4 },
      { label: "1 GB (High Performance)", value: "1g", isRecommended: totalMemGb > 4 && totalMemGb <= 8 },
      { label: "2 GB (Intensive)", value: "2g", isRecommended: totalMemGb > 8 && totalMemGb <= 16 },
      { label: "4 GB (Enterprise)", value: "4g", isRecommended: totalMemGb > 16 },
    ];

    const cpuPresetOptions = [
      { label: "0.25 Cores (Throttle)", value: "0.25" },
      { label: "0.5 Cores (Light)", value: "0.5", isRecommended: cpuCores <= 1 },
      { label: "1.0 Core (Dedicated)", value: "1.0", isRecommended: cpuCores > 1 && cpuCores <= 2 },
      { label: "2.0 Cores (High)", value: "2.0", isRecommended: cpuCores > 2 && cpuCores <= 4 },
      { label: "4.0 Cores (Heavy)", value: "4.0", isRecommended: cpuCores > 4 },
    ];

    const maxConcurrentJobs = Math.max(2, Math.min(12, cpuCores * 2));
    const maxRecommendedRunningContainers = Math.max(3, Math.floor(totalMemGb * 2));

    logger.debug({ totalMemGb, cpuCores, defaultDbMemory, defaultDbCpu }, "Calculated server capacity specs");

    return {
      hardware: {
        cpuCores,
        cpuModel,
        totalMemoryBytes: totalMem,
        totalMemoryMb: totalMemMb,
        totalMemoryGb: totalMemGb,
        freeMemoryMb: freeMemMb,
        loadAverage: os.loadavg() as [number, number, number],
        platform: os.platform(),
        arch: os.arch(),
      },
      recommendations: {
        database: {
          memoryLimit: defaultDbMemory,
          cpuLimit: defaultDbCpu,
          memoryPresetOptions,
          cpuPresetOptions,
        },
        cron: {
          maxConcurrentJobs,
          defaultTimeoutSeconds: 60,
          recommendedTimeoutCeiling: 300,
        },
        container: {
          maxRecommendedRunningContainers,
          defaultMemoryLimit: defaultDbMemory,
        },
      },
    };
  }
}

export const serverSpecsService = new ServerSpecsService();
