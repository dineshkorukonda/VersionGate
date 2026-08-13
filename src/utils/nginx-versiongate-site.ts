/** Normalize base path: always starts with "/", no trailing slash except "/". */
export function normalizePublicBasePath(raw: string | undefined): string {
  let p = (raw ?? "/").trim();
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

export interface VersionGateNginxOptions {
  /** `server_name` value — hostname, or `_` when binding by IP. */
  serverName: string;
  /** When true, use `listen 80 default_server;` (IPv4-only setup wizard style). */
  defaultServer: boolean;
  upstreamHost: string;
  upstreamPort: number;
  /** URL path prefix where the app is mounted (e.g. `/` or `/versiongate`). */
  basePath: string;
}

export interface AppNginxOptions {
  appId: string;
  domainOrSubdomain: string;
  internalPort: number;
}

/**
 * Builds a magic IP domain using sslip.io for preview testing (e.g. app1.1.2.3.4.sslip.io).
 */
export function buildMagicIpDomain(appId: string, publicIp: string): string {
  const cleanIp = publicIp.trim().replace(/[^0-9.]/g, "");
  return `${appId}.${cleanIp}.sslip.io`;
}

/**
 * Generates an Nginx virtual host configuration block for individual applications, custom domains, or magic IP domains.
 */
export function generateAppNginxConf(opts: AppNginxOptions): string {
  return `server {
    listen 80;
    server_name ${opts.domainOrSubdomain};

    location / {
        proxy_pass http://127.0.0.1:${opts.internalPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
}

/**
 * Single HTTP server block proxying to the VersionGate API (Fastify).
 * Run Certbot afterward to add TLS (`certbot --nginx`).
 */
export function generateVersionGateNginxConf(opts: VersionGateNginxOptions): string {
  const base = normalizePublicBasePath(opts.basePath);
  const listen = opts.defaultServer ? "listen 80 default_server;" : "listen 80;";
  const upstream = `http://${opts.upstreamHost}:${opts.upstreamPort}`;

  const proxyHeaders = `        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;`;

  let locationBlock: string;
  if (base === "/") {
    locationBlock = `    location / {
        proxy_pass         ${upstream};
${proxyHeaders}
    }`;
  } else {
    const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
    locationBlock = `    location = ${prefix} {
        return 302 ${prefix}/;
    }

    location ${prefix}/ {
        rewrite ^${prefix}/(.*)$ /$1 break;
        proxy_pass         ${upstream};
${proxyHeaders}
    }

    location /p/ {
        proxy_pass         ${upstream};
${proxyHeaders}
    }`;
  }

  return `server {
    ${listen}
    server_name ${opts.serverName};

    client_max_body_size 50M;

${locationBlock}
}
`;
}
