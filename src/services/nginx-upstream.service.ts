/**
 * Sanitizes strings for safe inclusion in Nginx identifiers (upstream names, variables).
 */
export function sanitizeNginxIdentifier(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

export interface NginxUpstreamOptions {
  projectName?: string;
  environmentName?: string;
  port: number;
}

export class NginxUpstreamService {
  /**
   * Generates a unique, valid Nginx upstream name for a project & environment.
   */
  buildUpstreamName(projectName?: string, environmentName?: string): string {
    if (!projectName) return "versiongate_backend";
    const proj = sanitizeNginxIdentifier(projectName);
    const env = environmentName ? sanitizeNginxIdentifier(environmentName) : "production";
    return `versiongate_upstream_${proj}_${env}`;
  }

  /**
   * Generates the Nginx upstream config content pointing to the target port.
   */
  buildNginxUpstreamConfig(options: NginxUpstreamOptions): string {
    const upstreamName = this.buildUpstreamName(options.projectName, options.environmentName);
    const lines = [
      `upstream ${upstreamName} {`,
      `  server 127.0.0.1:${options.port};`,
      `}`,
    ];

    // Maintain backwards compatibility for single-upstream default setups
    if (upstreamName !== "versiongate_backend") {
      lines.push(
        `upstream versiongate_backend {`,
        `  server 127.0.0.1:${options.port};`,
        `}`
      );
    }

    return lines.join("\n") + "\n";
  }
}
