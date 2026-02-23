"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpportunityById = exports.listOpportunities = void 0;
const db_1 = require("../services/db");
const opportunity_validator_1 = require("../validators/opportunity.validator");
const listOpportunities = async (req, res, next) => {
    try {
        const query = opportunity_validator_1.listOpportunitiesSchema.parse(req.query);
        const { search, sort, page, limit } = query;
        const skip = (page - 1) * limit;
        const where = search
            ? { title: { contains: search, mode: 'insensitive' } }
            : {};
        const orderBy = sort === 'most_pay'
            ? [{ payMax: 'desc' }]
            : sort === 'trending'
                ? [{ hiredThisMonth: 'desc' }, { createdAt: 'desc' }]
                : sort === 'priority'
                    ? [{ bounty: 'desc' }]
                    : [{ createdAt: 'desc' }];
        const [opportunities, total] = await Promise.all([
            db_1.prisma.opportunity.findMany({
                where,
                orderBy,
                skip,
                take: limit,
            }),
            db_1.prisma.opportunity.count({ where }),
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
    }
    catch (error) {
        next(error);
    }
};
exports.listOpportunities = listOpportunities;
const getOpportunityById = async (req, res, next) => {
    try {
        const id = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
        const opportunity = await db_1.prisma.opportunity.findUnique({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getOpportunityById = getOpportunityById;
