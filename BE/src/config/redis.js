const Redis = require('ioredis');
const logger = require('../utils/logger'); // Giả sử có file logger
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  logger.error('REDIS_URL is not defined in .env');
}

// Cấu hình kết nối cho BullMQ (yêu cầu maxRetriesPerRequest: null)
const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Bắt buộc cho BullMQ
  tls: REDIS_URL && REDIS_URL.startsWith('rediss://') ? {
    rejectUnauthorized: false // Bật TLS/SSL cho Upstash
  } : undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisConnection.on('connect', () => {
  logger.info('✅ Kết nối Redis (Upstash) thành công.');
});

redisConnection.on('error', (err) => {
  logger.error(`❌ Lỗi kết nối Redis: ${err.message}`);
});

module.exports = redisConnection;
