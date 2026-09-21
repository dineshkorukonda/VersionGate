import { request } from "./client";
import type { ApiTokenItem, AuthStatus } from "./types";

export function getAuthStatus(): Promise<AuthStatus> {
  return request("GET", "/auth/status");
}

export function getAuthMe(): Promise<{ authenticated: boolean; user?: { id: string; email: string } }> {
  return request("GET", "/auth/me");
}

export function authRegister(body: { email: string; password: string }): Promise<{ user: { id: string; email: string } }> {
  return request("POST", "/auth/register", body);
}

export function authLogin(body: { email: string; password: string }): Promise<{ user: { id: string; email: string } }> {
  return request("POST", "/auth/login", body);
}

export function authLogout(): Promise<{ ok: boolean }> {
  return request("POST", "/auth/logout");
}

export function changePassword(body: { currentPassword?: string; newPassword: string }): Promise<{ ok: boolean; message: string }> {
  return request("POST", "/auth/password", body);
}

export function getApiTokens(): Promise<{ tokens: ApiTokenItem[] }> {
  return request("GET", "/auth/tokens");
}

export function createApiToken(name: string): Promise<{ token: { id: string; name: string; token: string; tokenPrefix: string; createdAt: string } }> {
  return request("POST", "/auth/tokens", { name });
}

export function revokeApiToken(id: string): Promise<{ ok: boolean }> {
  return request("DELETE", `/auth/tokens/${id}`);
}
