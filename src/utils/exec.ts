import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export interface ExecResult {
  stdout: string;
  stderr: string;
}

/**
 * Promisified child_process.exec with error normalization.
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
