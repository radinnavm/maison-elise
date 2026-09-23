import { disconnectPrisma } from '../config/prisma.js';
import { notificationService } from '../services/notification.service.js';
import { logger } from '../utils/logger.js';

/**
 * Re-sends transactional emails that were left PENDING after an interrupted
 * process. Run manually:
 *
 *   pnpm --filter @maison-elise/api email:recover
 *
 * Safe to run repeatedly: it only targets records still PENDING and older than
 * EMAIL_PENDING_RECOVERY_MS (default 15 minutes), and never creates new records.
 */
async function main(): Promise<void> {
  const result = await notificationService.recoverPendingDeliveries();

  logger.info('email pending recovery complete', {
    recovered: result.recovered,
    failed: result.failed,
    skipped: result.skipped,
  });
  console.log(
    `Email recovery complete — recovered: ${result.recovered}, failed: ${result.failed}, skipped: ${result.skipped}`,
  );
}

main()
  .catch((error: unknown) => {
    logger.error('email pending recovery failed', {
      reason: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  })
  .finally(() => {
    void disconnectPrisma();
  });
