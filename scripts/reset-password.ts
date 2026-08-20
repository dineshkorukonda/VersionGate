#!/usr/bin/env bun
/**
 * Reset password for an existing dashboard user.
 * Loads `.env` like the API (DATABASE_URL required).
 *
 *   bun run reset-password you@example.com 'your-new-secure-password'
 */
import "../src/config/env";
import { UserRepository } from "../src/repositories/user.repository";
import {
  AUTH_MIN_PASSWORD_LENGTH,
  hashPassword,
  isValidEmail,
} from "../src/services/auth.service";

const userRepo = new UserRepository();

const emailRaw = process.argv[2];
const password = process.argv[3];

if (!emailRaw || !password) {
  console.error("Usage: bun run reset-password <email> <new-password>");
  console.error(`Password must be at least ${AUTH_MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}

const email = emailRaw.trim().toLowerCase();

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is not set. Add it to .env or the environment, then retry.");
  process.exit(1);
}

if (!isValidEmail(email)) {
  console.error("Invalid email.");
  process.exit(1);
}

if (password.length < AUTH_MIN_PASSWORD_LENGTH) {
  console.error(`Password must be at least ${AUTH_MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}

try {
  const existingUser = await userRepo.findByEmail(email);
  if (!existingUser) {
    console.error(`User with email "${email}" does not exist.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await userRepo.updatePasswordByEmail(email, passwordHash);

  console.log(`[ OK ] Password successfully reset for ${email}. You can now sign in at the dashboard.`);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("Failed:", msg);
  process.exit(1);
}
