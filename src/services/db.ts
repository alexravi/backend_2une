import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

prisma.$connect()
    .then(() => {
        console.log('✅ Successfully connected to Azure PostgreSQL Database');
    })
    .catch((error) => {
        console.error('❌ Failed to connect to Azure PostgreSQL Database:', error);
    });
