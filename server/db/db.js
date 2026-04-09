import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;

export const db =
    globalForPrisma.db ||
    new PrismaClient({
        log: ['query', 'error', 'warn'], // Optional: helps with debugging SQL queries
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.db = db;

export default db;