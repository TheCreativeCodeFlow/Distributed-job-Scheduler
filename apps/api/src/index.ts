import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './logger/index.js';
import { Database } from './database/index.js';
import { RedisService } from './redis/index.js';

import { Server } from 'http';

let server: Server;

const bootstrap = async () => {
  try {
    logger.info('🚀 Starting Distributed Job Scheduler API platform...');

    // 1. Initialize DB Connection
    await Database.connect();

    // 2. Initialize Redis Connection
    RedisService.getInstance();

    // 3. Start HTTP Server listening
    server = app.listen(config.port, () => {
      logger.info(
        `🔥 Server successfully listening on http://localhost:${config.port}`,
      );
      logger.info(
        `📄 API Docs available at http://localhost:${config.port}/docs`,
      );
    });
  } catch (error) {
    logger.error({ error }, '❌ Application bootstrap failure occurred.');
    process.exit(1);
  }
};

const handleGracefulShutdown = async (signal: string) => {
  logger.info(
    `Received signal: ${signal}. Commencing graceful shutdown flow...`,
  );

  if (server) {
    logger.info('Stopping HTTP server from accepting new traffic...');
    await new Promise<void>((resolve) => {
      server.close(() => {
        logger.info('HTTP server closed.');
        resolve();
      });
    });
  }

  // Close external service connections
  try {
    await RedisService.disconnect();
    await Database.disconnect();
    logger.info('Shutdown completed successfully. Exiting process.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during graceful shutdown execution.');
    process.exit(1);
  }
};

// Catch process terminate events
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection detected.');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught system exception caught.');
  handleGracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Run bootstrapping
bootstrap();
