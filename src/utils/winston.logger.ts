import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const DailyRotateFile = require('winston-daily-rotate-file');

const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = winston.format;

const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp: ts, context, trace }) => {
    const ctx = context ? ` [${context}]` : '';
    const err = trace ? `\n${trace}` : '';
    return `${ts} ${level}${ctx} ${message}${err}`;
  }),
);

export const winstonInstance = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),

    // All levels → application log (rotated daily, kept 14 days)
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    }),

    // Error-only log (kept 30 days)
    new DailyRotateFile({
      level: 'error',
      filename: path.join(LOG_DIR, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    }),
  ],
});

/** NestJS-compatible LoggerService backed by Winston. */
export class WinstonLoggerService implements LoggerService {
  log(message: any, context?: string) {
    winstonInstance.info(typeof message === 'object' ? JSON.stringify(message) : message, { context });
  }
  error(message: any, trace?: string, context?: string) {
    winstonInstance.error(typeof message === 'object' ? JSON.stringify(message) : message, { trace, context });
  }
  warn(message: any, context?: string) {
    winstonInstance.warn(typeof message === 'object' ? JSON.stringify(message) : message, { context });
  }
  debug(message: any, context?: string) {
    winstonInstance.debug(typeof message === 'object' ? JSON.stringify(message) : message, { context });
  }
  verbose(message: any, context?: string) {
    winstonInstance.verbose(typeof message === 'object' ? JSON.stringify(message) : message, { context });
  }
}
