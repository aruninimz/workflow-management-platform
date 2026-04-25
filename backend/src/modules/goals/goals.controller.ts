import { Request, Response, NextFunction } from 'express';
import { GoalsService } from './goals.service';
import {
  createGoalSchema,
  updateGoalSchema,
  updateGoalProgressSchema,
  queryGoalsSchema,
} from './goals.validation';
import { AuthRequest } from '../../middleware/auth';

const goalsService = new GoalsService();

export class GoalsController {
  // POST /api/goals
  async createGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createGoalSchema.parse(req.body);
      const goal = await goalsService.createGoal(req.user!.userId, data);

      res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        data: goal,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/goals
  async getGoals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = queryGoalsSchema.parse(req.query);
      const result = await goalsService.getGoals(req.user!.userId, req.user!.role, query);

      res.json({
        success: true,
        data: result.goals,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/goals/:id
  async getGoalById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const goal = await goalsService.getGoalById(req.params.id, req.user!.userId, req.user!.role);

      res.json({
        success: true,
        data: goal,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/goals/:id
  async updateGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = updateGoalSchema.parse(req.body);
      const goal = await goalsService.updateGoal(req.params.id, req.user!.userId, req.user!.role, data);

      res.json({
        success: true,
        message: 'Goal updated successfully',
        data: goal,
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/goals/:id/progress
  async updateGoalProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = updateGoalProgressSchema.parse(req.body);
      const goal = await goalsService.updateGoalProgress(req.params.id, req.user!.userId, req.user!.role, data);

      res.json({
        success: true,
        message: 'Goal progress updated successfully',
        data: goal,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/goals/:id
  async deleteGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await goalsService.deleteGoal(req.params.id, req.user!.userId, req.user!.role);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/goals/stats
  async getGoalStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await goalsService.getGoalStats(req.user!.userId, req.user!.role);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/goals/overdue
  async getOverdueGoals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const goals = await goalsService.getOverdueGoals(req.user!.userId, req.user!.role);

      res.json({
        success: true,
        data: goals,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/goals/upcoming
  async getUpcomingGoals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      const goals = await goalsService.getUpcomingGoals(req.user!.userId, req.user!.role, days);

      res.json({
        success: true,
        data: goals,
      });
    } catch (error) {
      next(error);
    }
  }
}
