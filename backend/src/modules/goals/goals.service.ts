import prisma from '../../config/database';
import { createError } from '../../middleware/errorHandler';
import type {
  CreateGoalInput,
  UpdateGoalInput,
  UpdateGoalProgressInput,
  QueryGoalsInput,
} from './goals.validation';

export class GoalsService {
  // Create a new goal
  async createGoal(userId: string, data: CreateGoalInput) {
    const goal = await prisma.goal.create({
      data: {
        ...data,
        ownerId: userId,
        startDate: new Date(data.startDate),
        targetDate: new Date(data.targetDate),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        _count: {
          select: {
            milestones: true,
            tasks: true,
          },
        },
      },
    });

    return goal;
  }

  // Get all goals with filters and pagination
  async getGoals(userId: string, userRole: string, query: QueryGoalsInput) {
    const { page = 1, limit = 10, status, priority, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Non-admin users can only see their own goals
    if (userRole !== 'ADMIN') {
      where.ownerId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.goal.count({ where });

    // Get goals
    const goals = await prisma.goal.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        _count: {
          select: {
            milestones: true,
            tasks: true,
          },
        },
      },
    });

    return {
      goals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  // Get a single goal by ID
  async getGoalById(goalId: string, userId: string, userRole: string) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        milestones: {
          orderBy: { dueDate: 'asc' },
          include: {
            _count: {
              select: {
                tasks: true,
              },
            },
          },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            milestones: true,
            tasks: true,
          },
        },
      },
    });

    if (!goal) {
      throw createError.notFound('Goal not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN' && goal.ownerId !== userId) {
      throw createError.forbidden('You do not have permission to access this goal');
    }

    return goal;
  }

  // Update a goal
  async updateGoal(goalId: string, userId: string, userRole: string, data: UpdateGoalInput) {
    // Get existing goal
    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!existingGoal) {
      throw createError.notFound('Goal not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN' && existingGoal.ownerId !== userId) {
      throw createError.forbidden('You do not have permission to update this goal');
    }

    // Prepare update data
    const updateData: any = { ...data };

    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }

    if (data.targetDate) {
      updateData.targetDate = new Date(data.targetDate);
    }

    // Update goal
    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        _count: {
          select: {
            milestones: true,
            tasks: true,
          },
        },
      },
    });

    return goal;
  }

  // Update goal progress
  async updateGoalProgress(goalId: string, userId: string, userRole: string, data: UpdateGoalProgressInput) {
    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!existingGoal) {
      throw createError.notFound('Goal not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN' && existingGoal.ownerId !== userId) {
      throw createError.forbidden('You do not have permission to update this goal');
    }

    // Automatically update status based on progress
    let status = existingGoal.status;
    if (data.progress === 0 && status === 'NOT_STARTED') {
      status = 'NOT_STARTED';
    } else if (data.progress > 0 && data.progress < 100) {
      status = 'IN_PROGRESS';
    } else if (data.progress === 100) {
      status = 'COMPLETED';
    }

    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        progress: data.progress,
        status,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        _count: {
          select: {
            milestones: true,
            tasks: true,
          },
        },
      },
    });

    return goal;
  }

  // Delete a goal
  async deleteGoal(goalId: string, userId: string, userRole: string) {
    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!existingGoal) {
      throw createError.notFound('Goal not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN' && existingGoal.ownerId !== userId) {
      throw createError.forbidden('You do not have permission to delete this goal');
    }

    // Delete goal (cascade will delete related milestones and tasks)
    await prisma.goal.delete({
      where: { id: goalId },
    });

    return { message: 'Goal deleted successfully' };
  }

  // Get goal statistics
  async getGoalStats(userId: string, userRole: string) {
    const where: any = userRole !== 'ADMIN' ? { ownerId: userId } : {};

    const [total, notStarted, inProgress, completed, onHold, byPriority, byCategory] = await Promise.all([
      prisma.goal.count({ where }),
      prisma.goal.count({ where: { ...where, status: 'NOT_STARTED' } }),
      prisma.goal.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.goal.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.goal.count({ where: { ...where, status: 'ON_HOLD' } }),
      prisma.goal.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      prisma.goal.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: {
        notStarted,
        inProgress,
        completed,
        onHold,
      },
      byPriority: byPriority.reduce((acc: any, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {}),
      byCategory: byCategory.reduce((acc: any, item) => {
        if (item.category) {
          acc[item.category] = item._count;
        }
        return acc;
      }, {}),
    };
  }

  // Get overdue goals
  async getOverdueGoals(userId: string, userRole: string) {
    const where: any = {
      targetDate: { lt: new Date() },
      status: { not: 'COMPLETED' },
    };

    if (userRole !== 'ADMIN') {
      where.ownerId = userId;
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { targetDate: 'asc' },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        _count: {
          select: {
            milestones: true,
            tasks: true,
          },
        },
      },
    });

    return goals;
  }

  // Get upcoming goals (due within next 7 days)
  async getUpcomingGoals(userId: string, userRole: string, days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const where: any = {
      targetDate: {
        gte: new Date(),
        lte: futureDate,
      },
      status: { not: 'COMPLETED' },
    };

    if (userRole !== 'ADMIN') {
      where.ownerId = userId;
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { targetDate: 'asc' },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        _count: {
          select: {
            milestones: true,
            tasks: true,
          },
        },
      },
    });

    return goals;
  }
}
