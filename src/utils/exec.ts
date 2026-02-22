import { exec, execFile } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);
const execFilePromise = promisify(execFile);

export interface ExecResult {
  stdout: string;
  stderr: string;
}

/**
 * Promisified child_process.exec (shell=true).
 * Prefer execFileAsync for external commands to avoid shell injection.
 */
export async function execAsync(command: string): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execPromise(command);
    return { stdout, stderr };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Command failed: ${command}\n${message}`);
  }
}

/**
 * Promisified child_process.execFile (shell=false).
 * Arguments are passed as an array — no shell expansion, no injection risk.
 * maxBuffer raised to 50 MB to handle large Docker build output.
 */
export async function execFileAsync(cmd: string, args: string[]): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execFilePromise(cmd, args, { maxBuffer: 50 * 1024 * 1024 });
    return { stdout: stdout.toString(), stderr: stderr.toString() };
  } catch (err: unknown) {
    // execFile errors carry .stderr with the actual output — include it in the message
    const errObj = err as NodeJS.ErrnoException & { stderr?: Buffer | string; stdout?: Buffer | string };
    const stderr = errObj.stderr ? errObj.stderr.toString().trim() : "";
    const detail = stderr || (err instanceof Error ? err.message : String(err));
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}\n${detail}`);
  }
}
