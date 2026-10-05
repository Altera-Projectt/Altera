const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');
const logger = require('./utils/logger');

const startServer = async () => {
  await connectDB();

  const membershipService = require('./services/membership.service');
  const expiryJob = setInterval(() => membershipService.expireMemberships().catch((error) => logger.error(`Membership expiry job failed: ${error.message}`)), 60 * 60 * 1000);

  // Keep-alive: ping server mỗi 10 phút để tránh Render Free cold start
  let keepAliveJob = null;
  if (process.env.NODE_ENV === 'production') {
    const https = require('https');
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://altera-2v4j.onrender.com';
    keepAliveJob = setInterval(() => {
      https.get(RENDER_URL, (res) => {
        logger.info(`[Keep-Alive] Pinged ${RENDER_URL} → ${res.statusCode}`);
      }).on('error', (err) => {
        logger.warn(`[Keep-Alive] Ping failed: ${err.message}`);
      });
    }, 10 * 60 * 1000); // 10 phút
    logger.info(`[Keep-Alive] ✅ Đã bật keep-alive ping mỗi 10 phút → ${RENDER_URL}`);
  }

  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📋 API base: http://localhost:${PORT}/api/v1`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    clearInterval(expiryJob);
    if (keepAliveJob) clearInterval(keepAliveJob);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    server.close(() => process.exit(1));
  });
};

startServer();
