import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).default('NOT_STARTED'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']).default('MEDIUM'),
  startDate: z.string().datetime().or(z.date()),
  targetDate: z.string().datetime().or(z.date()),
  category: z.string().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  targetDate: z.string().datetime().or(z.date()).optional(),
  category: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const updateGoalProgressSchema = z.object({
  progress: z.number().min(0).max(100),
});

export const queryGoalsSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'targetDate', 'progress', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type UpdateGoalProgressInput = z.infer<typeof updateGoalProgressSchema>;
export type QueryGoalsInput = z.infer<typeof queryGoalsSchema>;
