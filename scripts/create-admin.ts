#!/usr/bin/env bun
/**
 * Create the first dashboard user when the User table is empty,
 * or reset/create an admin user if `--reset` / `--force` is provided.
 * Loads `.env` like the API (DATABASE_URL required).
 *
 *   bun run create-admin you@example.com 'your-secure-password'
 *   bun run create-admin you@example.com 'your-secure-password' --reset
 */
import "../src/config/env";
import { UserRepository } from "../src/repositories/user.repository";
import {
  AUTH_MIN_PASSWORD_LENGTH,
  hashPassword,
  isValidEmail,
} from "../src/services/auth.service";

const userRepo = new UserRepository();

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));

const emailRaw = positional[0];
const password = positional[1];
const isReset = flags.has("--reset") || flags.has("--force");

if (!emailRaw || !password) {
  console.error("Usage: bun run create-admin <email> <password> [--reset]");
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
  const n = await userRepo.countUsers();
  const existingUser = await userRepo.findByEmail(email);

  if (n > 0 && !isReset) {
    if (existingUser) {
      console.error(
        `User ${email} already exists. Use 'bun run reset-password ${email} <password>' or pass '--reset' flag to update.`
      );
    } else {
      console.error(
        "At least one user already exists. Sign in at the dashboard, use 'bun run reset-password', or pass '--reset' flag."
      );
    }
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  if (existingUser) {
    await userRepo.updatePasswordByEmail(email, passwordHash);
    console.log(`[ OK ] Updated password for existing administrator ${email}. Open dashboard and sign in.`);
  } else {
    await userRepo.createUser({ email, passwordHash });
    console.log(`[ OK ] Created administrator ${email}. Open the dashboard and sign in.`);
  }
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("Failed:", msg);
  process.exit(1);
}
