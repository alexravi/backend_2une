import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/db';
import { listOpportunitiesSchema } from '../validators/opportunity.validator';

export const listOpportunities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = listOpportunitiesSchema.parse(req.query);
        const { search, sort, page, limit } = query;
        const skip = (page - 1) * limit;

        const where = search
            ? { title: { contains: search, mode: 'insensitive' as const } }
            : {};

        const orderBy =
            sort === 'most_pay'
                ? [{ payMax: 'desc' as const }]
                : sort === 'trending'
                ? [{ hiredThisMonth: 'desc' as const }, { createdAt: 'desc' as const }]
                : sort === 'priority'
                ? [{ bounty: 'desc' as const }]
                : [{ createdAt: 'desc' as const }];

        const [opportunities, total] = await Promise.all([
            prisma.opportunity.findMany({
                where,
                orderBy,
                skip,
                take: limit,
            }),
            prisma.opportunity.count({ where }),
        ]);

        res.status(200).json({
            data: opportunities,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getOpportunityById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
        const opportunity = await prisma.opportunity.findUnique({
            where: { id: id },
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

        res.status(200).json(opportunity);
    } catch (error) {
        next(error);
    }
};
