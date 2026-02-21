import { Deployment, DeploymentStatus, Prisma } from "@prisma/client";
import prisma from "../prisma/client";

export class DeploymentRepository {
  async create(data: Prisma.DeploymentCreateInput): Promise<Deployment> {
    return prisma.deployment.create({ data });
  }

  async findById(id: string): Promise<Deployment | null> {
    return prisma.deployment.findUnique({ where: { id } });
  }

  async findActive(): Promise<Deployment | null> {
    return prisma.deployment.findFirst({
      where: { status: DeploymentStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPrevious(): Promise<Deployment | null> {
    // Returns the most recent ACTIVE deployment before the current one.
    return prisma.deployment.findFirst({
      where: { status: DeploymentStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
      skip: 1,
    });
  }

  async findAll(): Promise<Deployment[]> {
    return prisma.deployment.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: string, status: DeploymentStatus): Promise<Deployment> {
    return prisma.deployment.update({
      where: { id },
      data: { status },
    });
  }

  async getNextVersion(): Promise<number> {
    const latest = await prisma.deployment.findFirst({
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return (latest?.version ?? 0) + 1;
  }
}
