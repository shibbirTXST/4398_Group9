import pkg from 'pg';
const { Pool } = pkg;

import { PrismaClient } from '../generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global;

// Get the adapter
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg(new Pool({ connectionString }));

export const db =
    globalForPrisma.db ||
    new PrismaClient({
        log: ['query', 'error', 'warn'], // Optional: helps with debugging SQL queries
        adapter: adapter, // Explicitly specify the adapter for PostgreSQL
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.db = db;

export default db;