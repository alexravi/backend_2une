import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/db';

export const getApplicationProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const opportunityId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

        const opportunity = await prisma.opportunity.findUnique({
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

        const userCompletions = await prisma.userStepCompletion.findMany({
            where: { userId },
            include: { applicationStep: true },
        });
        const completionByStepId = new Map(userCompletions.map((c) => [c.applicationStepId, c]));

        const stepsWithStatus = (opportunity as { steps: { applicationStep: { id: string; name: string; type: string; isCore: boolean; sortOrder: number } }[] }).steps.map(({ applicationStep }: { applicationStep: { id: string; name: string; type: string; isCore: boolean; sortOrder: number } }) => {
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

        const completedCount = stepsWithStatus.filter(
            (s: { status: string }) => s.status === 'completed'
        ).length;
        const totalSteps = stepsWithStatus.length;

        res.status(200).json({
            opportunityId,
            completedCount,
            totalSteps,
            progressPercent: totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0,
            steps: stepsWithStatus,
        });
    } catch (error) {
        next(error);
    }
};

export const startOrUpdateApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const opportunityId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

        const opportunity = await prisma.opportunity.findUnique({
            where: { id: opportunityId },
        });

        if (!opportunity) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }

        const application = await prisma.opportunityApplication.upsert({
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
    } catch (error) {
        next(error);
    }
};

export const getUserStepCompletions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;

        const completions = await prisma.userStepCompletion.findMany({
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
                metadata: c.metadata ? (() => { try { return JSON.parse(c.metadata!); } catch { return c.metadata; } })() : null,
            })),
        });
    } catch (error) {
        next(error);
    }
};

export const completeStep = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const stepId = typeof req.params.stepId === 'string' ? req.params.stepId : req.params.stepId[0];
        const body = req.body as { status?: string; metadata?: Record<string, unknown> };

        const step = await prisma.applicationStep.findUnique({
            where: { id: stepId },
        });

        if (!step) {
            return res.status(404).json({ error: 'Application step not found' });
        }

        const status = (body.status === 'UPLOADED' || body.status === 'COMPLETED' ? body.status : 'COMPLETED') as 'UPLOADED' | 'COMPLETED';
        const metadata = body.metadata ? JSON.stringify(body.metadata) : undefined;

        const completion = await prisma.userStepCompletion.upsert({
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
    } catch (error) {
        next(error);
    }
};
