import { execAsync } from "./exec";
import { logger } from "./logger";

/**
 * Thin wrappers around Docker CLI commands via child_process.
 * Full implementations are stubbed — replace with real logic.
 */

export async function dockerPull(imageTag: string): Promise<void> {
  logger.info({ imageTag }, "Pulling Docker image");
  // TODO: implement real pull
  // await execAsync(`docker pull ${imageTag}`);
}

export async function dockerRun(opts: {
  containerName: string;
  imageTag: string;
  port: number;
  network: string;
}): Promise<void> {
  const { containerName, imageTag, port, network } = opts;
  logger.info(opts, "Starting Docker container");
  // TODO: implement real run
  // await execAsync(
  //   `docker run -d --name ${containerName} --network ${network} -p ${port}:80 ${imageTag}`
  // );
}

export async function dockerStop(containerName: string): Promise<void> {
  logger.info({ containerName }, "Stopping Docker container");
  // TODO: implement real stop + rm
  // await execAsync(`docker stop ${containerName} && docker rm ${containerName}`);
}

export async function dockerInspect(containerName: string): Promise<boolean> {
  logger.info({ containerName }, "Inspecting Docker container");
  // TODO: check if container is running
  // const { stdout } = await execAsync(`docker inspect -f '{{.State.Running}}' ${containerName}`);
  // return stdout.trim() === "true";
  return true;
}
