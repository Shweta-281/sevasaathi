import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { openapi } from './docs/openapi.js';
import { config } from './config.js';
import rateLimit from 'express-rate-limit';
import { sanitizeInput } from './middleware/sanitizeInput.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(pinoHttp({ logger, autoLogging: config.NODE_ENV !== 'test' }));

  // Webhook needs raw body — must run BEFORE express.json()
  app.use('/api/payments/razorpay/webhook', express.raw({ type: 'application/json' }));

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeInput);

  app.get('/api/docs.json', (_req, res) => res.json(openapi));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.use('/api', rateLimit({ windowMs: 15 * 60_000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }), routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
