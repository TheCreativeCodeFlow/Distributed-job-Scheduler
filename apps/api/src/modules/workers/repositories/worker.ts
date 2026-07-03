import { db } from '../../../database/index.js';
import { Worker, Prisma, WorkerStatus } from '@prisma/client';

export class WorkerRepository {
  /**
   * Finds a worker by ID.
   */
  public static async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Worker | null> {
    const client = tx || db;
    return client.worker.findFirst({
      where: { id },
    });
  }

  /**
   * Finds a worker by Hostname and Instance ID.
   */
  public static async findByHostnameAndInstance(
    hostname: string,
    instanceId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Worker | null> {
    const client = tx || db;
    return client.worker.findUnique({
      where: {
        hostname_instanceId: {
          hostname,
          instanceId,
        },
      },
    });
  }

  /**
   * Lists all workers.
   */
  public static async listAll(
    tx?: Prisma.TransactionClient,
  ): Promise<Worker[]> {
    const client = tx || db;
    return client.worker.findMany({
      orderBy: { registeredAt: 'desc' },
    });
  }

  /**
   * Creates a new worker.
   */
  public static async create(
    data: {
      hostname: string;
      instanceId: string;
      version: string;
      supportedQueues?: string[];
      supportedTags?: string[];
      maxConcurrency?: number;
      metadata?: Record<string, unknown>;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Worker> {
    const client = tx || db;
    return client.worker.create({
      data: {
        hostname: data.hostname,
        instanceId: data.instanceId,
        version: data.version,
        supportedQueues: data.supportedQueues || [],
        supportedTags: data.supportedTags || [],
        maxConcurrency: data.maxConcurrency ?? 5,
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        status: WorkerStatus.REGISTERING,
      },
    });
  }

  /**
   * Updates worker data.
   */
  public static async update(
    id: string,
    data: {
      status?: WorkerStatus;
      supportedQueues?: string[];
      supportedTags?: string[];
      maxConcurrency?: number;
      metadata?: Record<string, unknown>;
      lastActiveAt?: Date;
      version?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Worker> {
    const client = tx || db;
    const updateData: Prisma.WorkerUpdateInput = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.supportedQueues !== undefined)
      updateData.supportedQueues = data.supportedQueues;
    if (data.supportedTags !== undefined)
      updateData.supportedTags = data.supportedTags;
    if (data.maxConcurrency !== undefined)
      updateData.maxConcurrency = data.maxConcurrency;
    if (data.metadata !== undefined)
      updateData.metadata = data.metadata as Prisma.InputJsonValue;
    if (data.lastActiveAt !== undefined)
      updateData.lastActiveAt = data.lastActiveAt;
    if (data.version !== undefined) updateData.version = data.version;

    return client.worker.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Updates worker status.
   */
  public static async updateStatus(
    id: string,
    status: WorkerStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<Worker> {
    const client = tx || db;
    return client.worker.update({
      where: { id },
      data: { status, lastActiveAt: new Date() },
    });
  }
}
