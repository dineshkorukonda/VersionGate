import { request } from "./client";
import type {
  InstanceSettings,
  SelfUpdateGitStatus,
  SelfUpdateProgress,
  SelfUpdateSettingsResponse,
  SetupStatus,
} from "./types";

export function getSetupStatus(): Promise<SetupStatus> {
  return request("GET", "/setup/status");
}

export function applySetup(body: {
  domain: string;
  databaseUrl: string;
  adminEmail: string;
  adminPassword: string;
  geminiApiKey?: string;
}): Promise<{ configured: boolean }> {
  return request("POST", "/setup/apply", body);
}

export function getSelfUpdateSettings(): Promise<SelfUpdateSettingsResponse> {
  return request("GET", "/settings/self-update");
}

export function enableSelfUpdateFromSettings(): Promise<{ message: string }> {
  return request("POST", "/settings/self-update/enable");
}

export function checkSelfUpdateFromSettings(): Promise<SelfUpdateGitStatus> {
  return request("POST", "/settings/self-update/check");
}

export function applySelfUpdateFromSettings(): Promise<{ ok: boolean; started?: boolean; steps: string[]; error?: string }> {
  return request("POST", "/settings/self-update/apply");
}

export function getSelfUpdateProgress(): Promise<SelfUpdateProgress> {
  return request("GET", "/settings/self-update/progress");
}

export function getInstanceSettings(): Promise<InstanceSettings> {
  return request("GET", "/settings/instance");
}

export function patchInstanceEnv(env: Record<string, string>): Promise<{
  message: string;
  keysWritten: string[];
}> {
  return request("PATCH", "/settings/env", { env });
}

export function applyNginxSite(body: {
  publicDomain?: string;
  publicBasePath?: string;
}): Promise<{
  ok: boolean;
  message: string;
  path: string;
  publicDomain: string;
  publicBasePath: string;
}> {
  return request("POST", "/settings/nginx/apply", body);
}

export function requestCertbotSsl(body: {
  email?: string;
  /** Sent to API so `.env` matches the form before Certbot runs (recommended when switching subdomain). */
  publicDomain?: string;
}): Promise<{ ok: boolean; message: string }> {
  return request("POST", "/settings/ssl/certbot", body);
}
