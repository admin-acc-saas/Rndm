/**
 * Queue infrastructure status.
 *
 * BullMQ queues are registered by feature modules via `BullModule.registerQueue`
 * as real asynchronous work arrives in later phases (notifications, payment
 * webhooks, settlement, reconciliation). This service only reports whether
 * the queue infrastructure is enabled, so consumers never have to guess.
 */
export class QueueService {
  constructor(readonly enabled: boolean) {}
}
