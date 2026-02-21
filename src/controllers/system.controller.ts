import { FastifyRequest, FastifyReply } from "fastify";
import { ReconciliationService } from "../services/reconciliation.service";

const reconciliationService = new ReconciliationService();

export async function reconcileHandler(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const report = await reconciliationService.reconcile();
  reply.code(200).send({ ok: true, report });
}
