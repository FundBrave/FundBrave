import { z } from 'zod';

export const searchFiltersSchema = z.object({
  query: z.string().max(200, 'Search query too long'),
  categories: z.array(z.string()).optional(),
  status: z.enum(['all', 'active', 'ending_soon', 'completed']).default('all'),
  verifiedOnly: z.boolean().default(false),
  fundingRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().max(10000000).optional(),
  }).optional(),
  sort: z.enum(['relevance', 'recent', 'popular', 'ending_soon', 'most_raised']).default('relevance'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;
