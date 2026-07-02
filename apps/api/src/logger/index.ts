import { pino, LoggerOptions } from 'pino';
import { config } from '../config/index.js';

const isDev = config.env === 'development';

const options: LoggerOptions = {
  level: config.log.level,
  base: {
    env: config.env,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

if (isDev) {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(options);
export type Logger = typeof logger;
export { pino };
