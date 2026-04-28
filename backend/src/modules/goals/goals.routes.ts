import { Router } from 'express';
import { GoalsController } from './goals.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const goalsController = new GoalsController();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - targetDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [NOT_STARTED, IN_PROGRESS, COMPLETED, ON_HOLD]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL, URGENT]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Goal created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', goalsController.createGoal);

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: Get all goals with filters
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOT_STARTED, IN_PROGRESS, COMPLETED, ON_HOLD]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL, URGENT]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, targetDate, progress, title]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Goals retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', goalsController.getGoals);

/**
 * @swagger
 * /api/goals/stats:
 *   get:
 *     summary: Get goal statistics
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', goalsController.getGoalStats);

/**
 * @swagger
 * /api/goals/overdue:
 *   get:
 *     summary: Get overdue goals
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue goals retrieved successfully
 */
router.get('/overdue', goalsController.getOverdueGoals);

/**
 * @swagger
 * /api/goals/upcoming:
 *   get:
 *     summary: Get upcoming goals
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Upcoming goals retrieved successfully
 */
router.get('/upcoming', goalsController.getUpcomingGoals);

/**
 * @swagger
 * /api/goals/{id}:
 *   get:
 *     summary: Get goal by ID
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Goal retrieved successfully
 *       404:
 *         description: Goal not found
 */
router.get('/:id', goalsController.getGoalById);

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     summary: Update goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               startDate:
 *                 type: string
 *               targetDate:
 *                 type: string
 *               category:
 *                 type: string
 *               progress:
 *                 type: number
 *     responses:
 *       200:
 *         description: Goal updated successfully
 *       404:
 *         description: Goal not found
 */
router.put('/:id', goalsController.updateGoal);

/**
 * @swagger
 * /api/goals/{id}/progress:
 *   patch:
 *     summary: Update goal progress
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - progress
 *             properties:
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Progress updated successfully
 */
router.patch('/:id/progress', goalsController.updateGoalProgress);

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Delete goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Goal deleted successfully
 *       404:
 *         description: Goal not found
 */
router.delete('/:id', goalsController.deleteGoal);

export default router;
