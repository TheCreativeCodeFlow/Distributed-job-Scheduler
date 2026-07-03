import { z } from 'zod';

export const getDlqEntrySchema = {
  params: z.object({
    entryId: z.string().uuid('Invalid dead letter entry ID format.'),
  }),
};

export const replayDlqEntrySchema = {
  params: z.object({
    entryId: z.string().uuid('Invalid dead letter entry ID format.'),
  }),
};

export const deleteDlqEntrySchema = {
  params: z.object({
    entryId: z.string().uuid('Invalid dead letter entry ID format.'),
  }),
};
