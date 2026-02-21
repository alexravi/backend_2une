"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    console.error(err);
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.errors
        });
    }
    return res.status(500).json({
        error: 'Internal Server Error'
    });
};
exports.errorHandler = errorHandler;
