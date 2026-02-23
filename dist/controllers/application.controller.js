"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeStep = exports.getUserStepCompletions = exports.startOrUpdateApplication = exports.getApplicationProgress = void 0;
const db_1 = require("../services/db");
const getApplicationProgress = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const opportunityId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
        const opportunity = await db_1.prisma.opportunity.findUnique({
            where: { id: opportunityId },
            include: {
                steps: {
                    include: { applicationStep: true },
                    orderBy: { applicationStep: { sortOrder: 'asc' } },
                },
            },
        });
        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        const userCompletions = await db_1.prisma.userStepCompletion.findMany({
            where: { userId },
            include: { applicationStep: true },
        });
        const completionByStepId = new Map(userCompletions.map((c) => [c.applicationStepId, c]));
        const stepsWithStatus = opportunity.steps.map(({ applicationStep }) => {
            const completion = completionByStepId.get(applicationStep.id);
            const status = completion
                ? completion.status === 'COMPLETED' || completion.status === 'UPLOADED'
                    ? 'completed'
                    : 'pending'
                : 'pending';
            return {
                stepId: applicationStep.id,
                name: applicationStep.name,
                type: applicationStep.type,
                isCore: applicationStep.isCore,
                status,
                completedAt: completion?.completedAt ?? null,
                completionStatus: completion?.status ?? null,
            };
        });
        const completedCount = stepsWithStatus.filter((s) => s.status === 'completed').length;
        const totalSteps = stepsWithStatus.length;
        res.status(200).json({
            opportunityId,
            completedCount,
            totalSteps,
            progressPercent: totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0,
            steps: stepsWithStatus,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getApplicationProgress = getApplicationProgress;
const startOrUpdateApplication = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const opportunityId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
        const opportunity = await db_1.prisma.opportunity.findUnique({
            where: { id: opportunityId },
        });
        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }
        const application = await db_1.prisma.opportunityApplication.upsert({
            where: {
                userId_opportunityId: { userId, opportunityId },
            },
            create: {
                userId,
                opportunityId,
                status: 'DRAFT',
            },
            update: {},
        });
        res.status(200).json(application);
    }
    catch (error) {
        next(error);
    }
};
exports.startOrUpdateApplication = startOrUpdateApplication;
const getUserStepCompletions = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const completions = await db_1.prisma.userStepCompletion.findMany({
            where: { userId },
            include: { applicationStep: true },
        });
        res.status(200).json({
            data: completions.map((c) => ({
                stepId: c.applicationStepId,
                stepName: c.applicationStep.name,
                stepType: c.applicationStep.type,
                status: c.status,
                completedAt: c.completedAt,
                metadata: c.metadata ? (() => { try {
                    return JSON.parse(c.metadata);
                }
                catch {
                    return c.metadata;
                } })() : null,
            })),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserStepCompletions = getUserStepCompletions;
const completeStep = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const stepId = typeof req.params.stepId === 'string' ? req.params.stepId : req.params.stepId[0];
        const body = req.body;
        const step = await db_1.prisma.applicationStep.findUnique({
            where: { id: stepId },
        });
        if (!step) {
            return res.status(404).json({ error: 'Application step not found' });
        }
        const status = (body.status === 'UPLOADED' || body.status === 'COMPLETED' ? body.status : 'COMPLETED');
        const metadata = body.metadata ? JSON.stringify(body.metadata) : undefined;
        const completion = await db_1.prisma.userStepCompletion.upsert({
            where: {
                userId_applicationStepId: { userId, applicationStepId: stepId },
            },
            create: {
                userId,
                applicationStepId: stepId,
                status,
                completedAt: new Date(),
                metadata,
            },
            update: {
                status,
                completedAt: new Date(),
                ...(metadata !== undefined && { metadata }),
            },
        });
        res.status(200).json(completion);
    }
    catch (error) {
        next(error);
    }
};
exports.completeStep = completeStep;
