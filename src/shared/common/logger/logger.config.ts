import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

const loggerContext = process.env.APP_DISPLAY_NAME || 'LobocodeTemplate';

export const loggerConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        nestWinstonModuleUtilities.format.nestLike(loggerContext, {
          prettyPrint: true,
          colors: true,
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
}; 