const sharp = require('sharp');
const logger = require('./logger');

/**
 * Thuật toán tách nền tự động sử dụng Flood-Fill (BFS từ 4 góc và viền biên)
 * kết hợp Soft Edge Feathering & Defringing để tạo ảnh PNG có kênh Alpha trong suốt mượt mà.
 *
 * @param {Buffer|string} inputBuffer - Buffer ảnh hoặc chuỗi base64 / data URI
 * @param {object} options
 * @param {number} [options.tolerance=42] - Ngưỡng dung sai màu nền chính (pixel cách nền <= tolerance sẽ trong suốt hoàn toàn)
 * @param {number} [options.feather=32] - Dải biên chuyển tiếp mượt mà (chống răng cưa)
 * @returns {Promise<{ buffer: Buffer, width: number, height: number, isRemoved: boolean, durationMs: number }>}
 */
const removeBackground = async (inputBuffer, options = {}) => {
  const startTime = Date.now();
  const tolerance = typeof options.tolerance === 'number' ? options.tolerance : 42;
  const feather = typeof options.feather === 'number' ? options.feather : 32;
  const maxThreshold = tolerance + feather;

  // 1. Chuẩn hóa đầu vào sang Buffer
  let rawInput = inputBuffer;
  if (typeof rawInput === 'string') {
    const base64Data = rawInput.replace(/^data:image\/\w+;base64,/, '');
    rawInput = Buffer.from(base64Data, 'base64');
  }

  // 2. Lấy dữ liệu pixel thô RGBA qua sharp
  const img = sharp(rawInput);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // 3. Lấy mẫu màu nền dọc theo 4 cạnh viền ngoài cùng
  let sumR = 0, sumG = 0, sumB = 0, sampleCount = 0;
  for (let x = 0; x < width; x++) {
    for (const y of [0, 1, height - 2, height - 1]) {
      const idx = (y * width + x) * 4;
      sumR += data[idx]; sumG += data[idx + 1]; sumB += data[idx + 2];
      sampleCount++;
    }
  }
  for (let y = 0; y < height; y++) {
    for (const x of [0, 1, width - 2, width - 1]) {
      const idx = (y * width + x) * 4;
      sumR += data[idx]; sumG += data[idx + 1]; sumB += data[idx + 2];
      sampleCount++;
    }
  }

  const bgR = Math.round(sumR / sampleCount);
  const bgG = Math.round(sumG / sampleCount);
  const bgB = Math.round(sumB / sampleCount);
  const avgLuma = (bgR * 0.299 + bgG * 0.587 + bgB * 0.114);
  const isDarkBg = avgLuma < 80;
  const isLightBg = avgLuma > 180;

  // 4. Kiểm tra độ đồng nhất màu viền ngoài (nếu viền biến thiên quá lớn thì là ảnh phức tạp tràn viền)
  let borderVariance = 0;
  for (let x = 0; x < width; x++) {
    const idx0 = x * 4;
    borderVariance += Math.hypot(data[idx0] - bgR, data[idx0 + 1] - bgG, data[idx0 + 2] - bgB);
  }
  const avgBorderVariance = borderVariance / width;
  if (avgBorderVariance > 75 && !isDarkBg && !isLightBg) {
    const durationMs = Date.now() - startTime;
    return { buffer: rawInput, width, height, isRemoved: false, durationMs };
  }

  const colorDist = (r, g, b) => Math.hypot(r - bgR, g - bgG, b - bgB);

  // 5. Thuật toán Flood-Fill (BFS) khởi nguồn từ chu vi bên ngoài
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const queueX = new Int32Array(totalPixels);
  const queueY = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  const pushNode = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    queueX[tail] = x;
    queueY[tail] = y;
    tail++;
  };

  // Nạp toàn bộ các điểm trên 4 viền có màu tiệm cận màu nền
  for (let x = 0; x < width; x++) {
    const dTop = colorDist(data[x * 4], data[x * 4 + 1], data[x * 4 + 2]);
    if (dTop <= maxThreshold) pushNode(x, 0);

    const bIdx = ((height - 1) * width + x) * 4;
    const dBottom = colorDist(data[bIdx], data[bIdx + 1], data[bIdx + 2]);
    if (dBottom <= maxThreshold) pushNode(x, height - 1);
  }

  for (let y = 0; y < height; y++) {
    const lIdx = (y * width) * 4;
    const dLeft = colorDist(data[lIdx], data[lIdx + 1], data[lIdx + 2]);
    if (dLeft <= maxThreshold) pushNode(0, y);

    const rIdx = (y * width + (width - 1)) * 4;
    const dRight = colorDist(data[rIdx], data[rIdx + 1], data[rIdx + 2]);
    if (dRight <= maxThreshold) pushNode(width - 1, y);
  }

  let transparentPixelsCount = 0;

  // Lan truyền BFS
  while (head < tail) {
    const cx = queueX[head];
    const cy = queueY[head];
    head++;

    const idx = (cy * width + cx) * 4;
    const dist = colorDist(data[idx], data[idx + 1], data[idx + 2]);

    if (dist <= tolerance) {
      data[idx + 3] = 0; // Trong suốt hoàn toàn
      transparentPixelsCount++;
    } else if (dist <= maxThreshold) {
      // Làm mềm biên chuyển tiếp (Soft Alpha Feathering)
      const alphaRatio = (dist - tolerance) / feather;
      data[idx + 3] = Math.round(alphaRatio * 255);
      transparentPixelsCount++;

      // Khử viền đen / viền trắng (Defringe)
      if (isDarkBg && alphaRatio > 0.1) {
        data[idx] = Math.min(255, Math.round(data[idx] / alphaRatio));
        data[idx + 1] = Math.min(255, Math.round(data[idx + 1] / alphaRatio));
        data[idx + 2] = Math.min(255, Math.round(data[idx + 2] / alphaRatio));
      } else if (isLightBg && alphaRatio > 0.1) {
        data[idx] = Math.max(0, Math.round(255 - (255 - data[idx]) / alphaRatio));
        data[idx + 1] = Math.max(0, Math.round(255 - (255 - data[idx + 1]) / alphaRatio));
        data[idx + 2] = Math.max(0, Math.round(255 - (255 - data[idx + 2]) / alphaRatio));
      }
    }

    // Mở rộng 4 hướng lân cận
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIndex = ny * width + nx;
        if (!visited[nIndex]) {
          const pIdx = nIndex * 4;
          const nDist = colorDist(data[pIdx], data[pIdx + 1], data[pIdx + 2]);
          if (nDist <= maxThreshold) {
            pushNode(nx, ny);
          }
        }
      }
    }
  }

  // 6. Xuất ra buffer PNG trong suốt
  const outBuffer = await sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 8 })
    .toBuffer();

  const durationMs = Date.now() - startTime;
  logger.info(`[removeBackground] Hoàn tất tách nền trong ${durationMs}ms: ${transparentPixelsCount}/${totalPixels} pixels trong suốt.`);

  return {
    buffer: outBuffer,
    width,
    height,
    isRemoved: transparentPixelsCount > 100,
    transparentPixelsCount,
    durationMs,
  };
};

module.exports = {
  removeBackground,
};
