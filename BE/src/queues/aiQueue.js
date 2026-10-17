const { Queue, Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const designAiService = require('../services/design-ai.service');
const { uploadImage } = require('../utils/cloudinary');
const logger = require('../utils/logger');

const queueName = 'aiGenerationQueue';

const aiQueue = new Queue(queueName, {
  connection: redisConnection,
  skipVersionCheck: true,
  streams: {
    events: {
      maxLen: 50, // Giới hạn độ dài stream sự kiện để tiết kiệm bộ nhớ & lệnh Redis
    },
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 1800, // 30 phút tự xóa
      count: 20, // Chỉ giữ 20 job gần nhất
    },
    removeOnFail: {
      age: 3600,
      count: 10,
    }
  }
});

const isWorkerDisabled = process.env.DISABLE_AI_WORKER === 'true';

const aiWorker = isWorkerDisabled
  ? null
  : new Worker(queueName, async (job) => {
  const { userId, payload } = job.data;
  logger.info(`[Queue] Đang xử lý job AI Generation: ${job.id} cho user: ${userId}`);

  try {
    const rawResult = await designAiService.generateDesign(userId, payload);

    let finalUrl = rawResult.imageUrl;

    // 1. Nếu imageUrl là Base64 -> Upload lên Cloudinary để lấy link URL HTTPS
    if (typeof finalUrl === 'string' && finalUrl.startsWith('data:image/')) {
      logger.info(`[Queue] Bắt đầu upload ảnh lên Cloudinary cho job: ${job.id}...`);
      try {
        const uploadRes = await uploadImage(finalUrl, 'altera/designs/generated');
        finalUrl = uploadRes.url;
        const isBase64 = typeof finalUrl === 'string' && finalUrl.startsWith('data:image/');
        logger.info(`[Queue] Upload Cloudinary thành công: ${isBase64 ? '[Base64 Image]' : finalUrl}`);
      } catch (error) {
        console.error("❌ Lỗi upload Cloudinary:", error.message || error);
      }
    }

    // 2. CHỈ TRẢ VỀ CÁC FIELD CẦN THIẾT (Vài trăm bytes) VÀO REDIS
    // Tuyệt đối không đưa object `design` hay `history` vào returnvalue
    return {
      imageUrl: finalUrl,
      preview: finalUrl,
      designId: rawResult.designId?.toString() || rawResult.design?._id?.toString(),
      printSide: rawResult.printSide || payload.printSide || 'Front',
      prompt: rawResult.prompt || payload.prompt || '',
    };
  } catch (error) {
    logger.error(`[Queue] Lỗi khi xử lý job ${job.id}: ${error.message}`);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 2,
  skipVersionCheck: true,
  // ⚡ TỐI ƯU CHO UPSTASH REDIS FREE TIER (giảm >90% số lệnh khi nhàn rỗi):
  drainDelay: 60,          // Khi hàng đợi rỗng, chờ 60 giây mới kiểm tra Redis tiếp (thay vì 5 giây mặc định)
  stalledInterval: 300000, // 5 phút mới quét stalled job 1 lần (thay vì 30 giây mặc định)
  maxStalledCount: 1,
});

if (aiWorker) {
  aiWorker.on('completed', (job, result) => {
    const isBase64 = typeof result?.imageUrl === 'string' && result.imageUrl.startsWith('data:image/');
    logger.info(`[Queue] ✅ Job ${job.id} hoàn thành. URL: ${isBase64 ? '[Base64 Image]' : result?.imageUrl}`);
  });

  aiWorker.on('failed', (job, err) => {
    logger.error(`[Queue] ❌ Job ${job.id} thất bại: ${err?.message}`);
  });
} else {
  logger.info('[Queue] ⏸️ AI Worker đang tắt (DISABLE_AI_WORKER=true).');
}

module.exports = {
  aiQueue,
  aiWorker
};