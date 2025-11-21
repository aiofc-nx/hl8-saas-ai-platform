import { LoggerModule as PinoLoggerModule } from '@hl8/logger';
import { Module } from '@nestjs/common';
import { APP_NAME } from '@repo/constants/app';

/**
 * Logger module for application-wide request and response logging using Pino.
 *
 * Configures the Pino logger with pretty-printing and daily log file rotation.
 * Logs are output to both the console and a dated log file under `./storage/logs/`.
 */
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      useFactory: () => ({
        pinoHttp: {
          name: APP_NAME,
          autoLogging: true,
          transport: {
            targets: [
              {
                target: 'pino-pretty', // Console pretty-print
              },
              {
                target: 'pino-pretty', // File pretty-print
                options: {
                  destination: `./storage/logs/${new Date().toISOString().split('T')[0]}.log`,
                  mkdir: true,
                },
              },
            ],
          },
        },
      }),
    }),
  ],
})
export class LoggerModule {}
