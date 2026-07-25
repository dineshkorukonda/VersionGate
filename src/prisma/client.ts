import { getDb, disconnectDb } from "../db/client";

export function getPrisma() {
  return getDb();
}

export const prisma = getDb();
export { getDb, disconnectDb };
export async function disconnectPrisma(): Promise<void> {
  await disconnectDb();
}
export async function reconnectPrismaAfterSetup(): Promise<void> {
  // getDb() dynamically picks up DATABASE_URL
  getDb();
}
export default prisma;
