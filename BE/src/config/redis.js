const Redis = require('ioredis');
const logger = require('../utils/logger'); // Giả sử có file logger
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  logger.error('REDIS_URL is not defined in .env');
}

// Cấu hình kết nối tối ưu cho BullMQ + Upstash Redis (giảm thiểu số lệnh thừa)
const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Bắt buộc cho BullMQ
  enableReadyCheck: false,    // Không gửi lệnh INFO dư thừa mỗi lần kết nối
  connectTimeout: 10000,
  keepAlive: 30000,
  tls: REDIS_URL && REDIS_URL.startsWith('rediss://') ? {
    rejectUnauthorized: false // Bật TLS/SSL cho Upstash
  } : undefined,
  retryStrategy(times) {
    // Giãn cách kết nối lại từ 1s tăng dần lên tối đa 30s để tránh vòng lặp đốt lệnh khi mạng chập chờn
    return Math.min(times * 1000, 30000);
  }
});

redisConnection.on('connect', () => {
  logger.info('✅ Kết nối Redis (Upstash) thành công.');
});

redisConnection.on('error', (err) => {
  logger.error(`❌ Lỗi kết nối Redis: ${err.message}`);
});

module.exports = redisConnection;
