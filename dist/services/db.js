"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
exports.prisma.$connect()
    .then(() => {
    console.log('✅ Successfully connected to Azure PostgreSQL Database');
})
    .catch((error) => {
    console.error('❌ Failed to connect to Azure PostgreSQL Database:', error);
});
