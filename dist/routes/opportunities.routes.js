"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const opportunities_controller_1 = require("../controllers/opportunities.controller");
const application_controller_1 = require("../controllers/application.controller");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Opportunities
 *   description: Explore opportunities and application progress
 */
router.use(auth_1.authenticateToken);
/**
 * @swagger
 * /api/opportunities:
 *   get:
 *     summary: List opportunities
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by opportunity title
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [best_match, priority, trending, most_pay]
 *           default: best_match
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 12
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of opportunities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 *                       payMin: { type: number }
 *                       payMax: { type: number }
 *                       bounty: { type: number }
 *                       employmentType: { type: string }
 *                       isRemote: { type: boolean }
 *                       postedBy: { type: string }
 *                       hiredThisMonth: { type: number, nullable: true }
 *                       createdAt: { type: string, format: date-time }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *       401:
 *         description: Access token missing or invalid
 */
router.get('/', opportunities_controller_1.listOpportunities);
/**
 * @swagger
 * /api/opportunities/{id}/application:
 *   get:
 *     summary: Get application progress for an opportunity
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opportunity ID
 *     responses:
 *       200:
 *         description: Application progress (steps completed, progress %)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 opportunityId: { type: string }
 *                 completedCount: { type: integer }
 *                 totalSteps: { type: integer }
 *                 progressPercent: { type: integer }
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       stepId: { type: string }
 *                       name: { type: string }
 *                       type: { type: string }
 *                       isCore: { type: boolean }
 *                       status: { type: string, enum: [pending, completed] }
 *                       completedAt: { type: string, format: date-time, nullable: true }
 *                       completionStatus: { type: string, nullable: true }
 *       401:
 *         description: Access token missing or invalid
 *       404:
 *         description: Opportunity not found
 */
router.get('/:id/application', application_controller_1.getApplicationProgress);
/**
 * @swagger
 * /api/opportunities/{id}/application:
 *   post:
 *     summary: Start or update application for an opportunity
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opportunity ID
 *     responses:
 *       200:
 *         description: Application record (created or existing)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 userId: { type: string }
 *                 opportunityId: { type: string }
 *                 status: { type: string, enum: [DRAFT, SUBMITTED] }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *       401:
 *         description: Access token missing or invalid
 *       404:
 *         description: Opportunity not found
 */
router.post('/:id/application', application_controller_1.startOrUpdateApplication);
/**
 * @swagger
 * /api/opportunities/{id}:
 *   get:
 *     summary: Get a single opportunity by ID with required steps
 *     tags: [Opportunities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opportunity ID
 *     responses:
 *       200:
 *         description: Opportunity with required application steps
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 title: { type: string }
 *                 payMin: { type: number }
 *                 payMax: { type: number }
 *                 bounty: { type: number }
 *                 employmentType: { type: string }
 *                 isRemote: { type: boolean }
 *                 postedBy: { type: string }
 *                 hiredThisMonth: { type: number, nullable: true }
 *                 createdAt: { type: string, format: date-time }
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       applicationStep:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                           type: { type: string }
 *                           isCore: { type: boolean }
 *                           sortOrder: { type: integer }
 *       401:
 *         description: Access token missing or invalid
 *       404:
 *         description: Opportunity not found
 */
router.get('/:id', opportunities_controller_1.getOpportunityById);
exports.default = router;
