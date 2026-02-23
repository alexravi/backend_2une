"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOpportunitiesSchema = void 0;
const zod_1 = require("zod");
exports.listOpportunitiesSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    sort: zod_1.z.enum(['best_match', 'priority', 'trending', 'most_pay']).optional().default('best_match'),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(12),
});
