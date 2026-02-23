import { z } from 'zod';

export const listOpportunitiesSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(['best_match', 'priority', 'trending', 'most_pay']).optional().default('best_match'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export type ListOpportunitiesQuery = z.infer<typeof listOpportunitiesSchema>;
