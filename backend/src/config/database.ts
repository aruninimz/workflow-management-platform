import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log queries in development
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e: any) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

// Log errors
prisma.$on('error', (e: any) => {
  logger.error('Prisma Error:', e);
});

// Test database connection
prisma.$connect()
  .then(() => logger.info('✅ Database connected successfully'))
  .catch((err) => {
    logger.error('❌ Database connection failed:', err);
    process.exit(1);
  });

export default prisma;
