import { z } from 'zod';

export const promoteSchema = {
  body: z
    .object({
      batchSize: z
        .number()
        .int()
        .positive('Batch size must be a positive integer.')
        .optional(),
    })
    .optional(),
};
