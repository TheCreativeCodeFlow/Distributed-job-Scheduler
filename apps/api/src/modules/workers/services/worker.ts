import { WorkerRepository } from '../repositories/worker.js';
import { NotFoundError, ValidationError } from '../../../errors/index.js';
import { WorkerStatus, Worker } from '@prisma/client';
import { logger } from '../../../logger/index.js';
import { db } from '../../../database/index.js';

export class WorkerService {
  /**
   * Registers a worker.
   */
  public static async register(
    operatorUserId: string,
    data: {
      hostname: string;
      instanceId: string;
      version: string;
      supportedQueues?: string[];
      supportedTags?: string[];
      maxConcurrency?: number;
      metadata?: Record<string, unknown>;
    },
  ): Promise<Worker> {
    return db.$transaction(async (tx) => {
      // 1. Check if worker already exists with hostname + instanceId
      const existing = await WorkerRepository.findByHostnameAndInstance(
        data.hostname,
        data.instanceId,
        tx,
      );

      if (existing) {
        // If worker is OFFLINE, transition back to REGISTERING
        if (existing.status === WorkerStatus.OFFLINE) {
          logger.info(
            {
              workerId: existing.id,
              hostname: data.hostname,
              instanceId: data.instanceId,
            },
            'Offline worker registering again. Transitioning to REGISTERING.',
          );
          const updatePayload: Parameters<typeof WorkerRepository.update>[1] = {
            status: WorkerStatus.REGISTERING,
            version: data.version,
            lastActiveAt: new Date(),
          };
          if (data.supportedQueues !== undefined)
            updatePayload.supportedQueues = data.supportedQueues;
          if (data.supportedTags !== undefined)
            updatePayload.supportedTags = data.supportedTags;
          if (data.maxConcurrency !== undefined)
            updatePayload.maxConcurrency = data.maxConcurrency;
          if (data.metadata !== undefined)
            updatePayload.metadata = data.metadata;

          return WorkerRepository.update(existing.id, updatePayload, tx);
        }

        // Otherwise return existing registration
        logger.info(
          {
            workerId: existing.id,
            hostname: data.hostname,
            instanceId: data.instanceId,
          },
          'Active worker registered again. Returning existing record.',
        );
        return existing;
      }

      // Create new worker record
      const worker = await WorkerRepository.create(data, tx);
      logger.info(
        {
          workerId: worker.id,
          hostname: data.hostname,
          instanceId: data.instanceId,
        },
        'Worker registered successfully.',
      );
      return worker;
    });
  }

  /**
   * Updates worker status or capabilities.
   */
  public static async update(
    operatorUserId: string,
    workerId: string,
    data: {
      status?: WorkerStatus;
      supportedQueues?: string[];
      supportedTags?: string[];
      maxConcurrency?: number;
      metadata?: Record<string, unknown>;
    },
  ): Promise<Worker> {
    return db.$transaction(async (tx) => {
      const worker = await WorkerRepository.findById(workerId, tx);
      if (!worker) {
        throw new NotFoundError('Worker not found.');
      }

      // Check status transitions if requested
      if (data.status && data.status !== worker.status) {
        const current = worker.status;
        const target = data.status;

        const validTransitions: Record<WorkerStatus, WorkerStatus[]> = {
          [WorkerStatus.REGISTERING]: [
            WorkerStatus.REGISTERING,
            WorkerStatus.IDLE,
          ],
          [WorkerStatus.IDLE]: [WorkerStatus.IDLE, WorkerStatus.OFFLINE],
          [WorkerStatus.OFFLINE]: [
            WorkerStatus.OFFLINE,
            WorkerStatus.REGISTERING,
          ],
          // Reject other states for now
          [WorkerStatus.POLLING]: [],
          [WorkerStatus.CLAIMING]: [],
          [WorkerStatus.RUNNING]: [],
          [WorkerStatus.DRAINING]: [],
          [WorkerStatus.STOPPING]: [],
          [WorkerStatus.LOST]: [],
          [WorkerStatus.RECOVERING]: [],
        };

        const allowed = validTransitions[current] || [];
        if (!allowed.includes(target)) {
          logger.warn(
            { workerId, current, target },
            'Invalid worker transition attempted.',
          );
          throw new ValidationError(
            `Invalid worker status transition from ${current} to ${target}.`,
          );
        }
      }

      const updated = await WorkerRepository.update(
        workerId,
        {
          ...data,
          lastActiveAt: new Date(),
        },
        tx,
      );

      logger.info({ workerId }, 'Worker updated successfully.');
      return updated;
    });
  }

  /**
   * Deregisters a worker (transitions state to OFFLINE).
   */
  public static async deregister(
    operatorUserId: string,
    workerId: string,
  ): Promise<Worker> {
    return db.$transaction(async (tx) => {
      const worker = await WorkerRepository.findById(workerId, tx);
      if (!worker) {
        throw new NotFoundError('Worker not found.');
      }

      if (worker.status === WorkerStatus.OFFLINE) {
        return worker;
      }

      const updated = await WorkerRepository.update(
        workerId,
        { status: WorkerStatus.OFFLINE },
        tx,
      );

      logger.warn({ workerId }, 'Worker deregistered.');
      return updated;
    });
  }

  /**
   * Retrieves single worker details.
   */
  public static async get(
    _operatorUserId: string,
    workerId: string,
  ): Promise<Worker> {
    const worker = await WorkerRepository.findById(workerId);
    if (!worker) {
      throw new NotFoundError('Worker not found.');
    }
    return worker;
  }

  /**
   * Lists all workers.
   */
  public static async list(): Promise<Worker[]> {
    return WorkerRepository.listAll();
  }
}
