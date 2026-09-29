const Design = require('../models/Design');
const Order = require('../models/Order');
const { uploadImage } = require('../utils/cloudinary');
const OpenAI = require('openai');
const logger = require('../utils/logger');

const MAX_GENERATED_HISTORY = 5;
const MIN_GENERATE_INTERVAL_MS = 15_000;
const USER_GENERATION_CACHE = new Map();

const normalizePrompt = (prompt) => {
  if (typeof prompt !== 'string') return '';
  return prompt
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 200);
};

const getUserGenerationState = (userId) => {
  const key = userId.toString();
  if (!USER_GENERATION_CACHE.has(key)) {
    USER_GENERATION_CACHE.set(key, { history: [], lastGeneratedAt: 0 });
  }
  return USER_GENERATION_CACHE.get(key);
};

const clearUserGenerationState = (userId) => USER_GENERATION_CACHE.delete(userId.toString());

const canGenerateNow = (userId) => {
  const state = getUserGenerationState(userId);
  return Date.now() - state.lastGeneratedAt >= MIN_GENERATE_INTERVAL_MS;
};

const addGeneratedImageToHistory = (userId, item) => {
  const state = getUserGenerationState(userId);
  state.history.push(item);
  state.lastGeneratedAt = Date.now();
  if (state.history.length > MAX_GENERATED_HISTORY) {
    state.history.shift();
  }
  return state.history;
};

const getUserGenerationHistory = (userId) => getUserGenerationState(userId).history;

const legacyBuildDesignPrompt = ({ prompt, style, shirtType, colorPalette }) => {
  const pieces = [
    // Chỉ rõ là artwork/graphic 2D, không phải ảnh thật
    'Flat 2D graphic artwork, print-ready design for direct-to-garment shirt printing.',
    'Transparent or white background only.',
    `Subject: ${prompt.trim()}.`,
  ];

  if (style) pieces.push(`Art style: ${style}.`);
  if (colorPalette) pieces.push(`Color palette: ${colorPalette}.`);

  pieces.push([
    // Negative prompt — nói rõ KHÔNG làm gì
    'NO shirt or clothing in image.',
    'NO human figures, NO people, NO faces, NO models.',
    'NO photorealistic photography.',
    'NO text unless specifically requested.',
    'NO background scenery.',
    'Isolated graphic only, suitable for screen printing.',
    'High contrast, clean edges, print-ready artwork.',
  ].join(' '));

  return pieces.join(' ');
};

const buildDesignPrompt = ({ idea, style, globalShirtColor }) => `Create a print-ready graphic design for a custom t-shirt.\nUSER IDEA: ${idea}\nART STYLE: ${style}\nT-SHIRT BASE COLOR: ${globalShirtColor}\n\nREQUIREMENTS:\n- Create ONLY the graphic artwork.\n- Do NOT generate a t-shirt or a person wearing it.\n- Do NOT include a background scene.\n- STRICT RULE: Use a transparent background or a solid background that can be easily keyed out.\n- The artwork colors must contrast well against the base shirt color (${globalShirtColor}).\n- Center the main artwork. Make it suitable for printing on fabric.\n- Use strong silhouettes, clean edges, and the exact requested art style.\n- Avoid unnecessary tiny details.\n- Avoid photorealistic product photography.\n- The artwork should look intentional and professionally designed.\n- Do not add random text, letters, logos, watermarks, or brand names unless explicitly requested by the user.\n\nIMPORTANT:\nThe final result is artwork intended to be placed ON a t-shirt.\nIt is NOT a picture of a t-shirt.`;

const generateOpenAIImage = async (prompt) => {
  if (!process.env.OPENAI_API_KEY) {
    logger.error('OpenAI image generation unavailable: OPENAI_API_KEY is not configured.');
    const error = new Error('OpenAI API key is not configured.');
    error.statusCode = 401;
    throw error;
  }
  try {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
    const result = await openai.images.generate({ model: process.env.IMAGE_MODEL || 'gpt-image-2', prompt, quality: process.env.IMAGE_QUALITY || 'low', size: process.env.IMAGE_SIZE || '1024x1024', background: 'transparent', output_format: 'png', n: 1 });
    if (!result.data?.[0]?.b64_json) throw new Error('OpenAI returned no image data.');
    logger.info(`OpenAI image generation succeeded: model=${process.env.IMAGE_MODEL || 'gpt-image-2'} quality=${process.env.IMAGE_QUALITY || 'low'} size=${process.env.IMAGE_SIZE || '1024x1024'} n=1`);
    return Buffer.from(result.data[0].b64_json, 'base64');
  } catch (cause) {
    const status = cause.status || cause.statusCode;
    logger.error(`OpenAI image generation failed: status=${status || 'unknown'} code=${cause.code || 'unknown'} type=${cause.type || 'unknown'} message=${cause.message}`);
    const error = new Error('Unable to generate image right now.');
    error.statusCode = status === 401 || status === 403 ? 401 : status === 429 ? 429 : 500;
    throw error;
  }
};

const uploadGeneratedImage = async (imageBuffer) => {
  const dataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;
  const uploaded = await uploadImage(dataUri, 'designs/generated');
  return uploaded.url;
};

const generateDesign = async (userId, payload) => {
  const idea = normalizePrompt(payload.idea ?? payload.prompt);
  const style = typeof payload.style === 'string' ? payload.style.trim().slice(0, 60) : '';
  const globalShirtColor = payload.globalShirtColor || payload.shirtColor || '';
  const printSide = payload.printSide || 'Front';
  if (!idea || !style || !/^#[0-9a-f]{6}$/i.test(globalShirtColor) || !['Front', 'Back', 'Both Sides'].includes(printSide)) {
    const error = new Error('Provide idea, style, print side, and a valid shirt color.');
    error.statusCode = 400;
    throw error;
  }

  if (!canGenerateNow(userId)) {
    const error = new Error('Please wait 15 seconds before generating another image.');
    error.statusCode = 429;
    throw error;
  }

  const prompt = buildDesignPrompt({ idea, style, globalShirtColor });
  const imageBuffer = await generateOpenAIImage(prompt);
  const imageUrl = await uploadGeneratedImage(imageBuffer);

  const design = await Design.create({
    userId,
    shirtColor: globalShirtColor,
    prompt: idea,
    style,
    shirtType: null,
    colorPalette: globalShirtColor,
    customImage: imageUrl,
    previewImage: imageUrl,
    status: 'DRAFT',
  });

  const history = addGeneratedImageToHistory(userId, {
    prompt: idea,
    imageUrl,
    createdAt: new Date().toISOString(),
  });

  return {
    imageUrl,
    preview: imageUrl,
    printSide,
    prompt,
    designId: design._id,
    design,
    history,
  };
};

const refineDesign = async (designId, userId, role, { prompt }) => {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    const error = new Error('Prompt is required to refine a design.');
    error.statusCode = 400;
    throw error;
  }

  const design = await getOwnedDesign(designId, userId, role);
  const imageBuffer = await generateOpenAIImage(buildDesignPrompt({
    idea: `${design.prompt || 'Existing design'}. Refine request: ${prompt.trim()}`,
    style: design.style || 'Graphic Art',
    globalShirtColor: design.shirtColor || '#ffffff',
  }));
  const imageUrl = await uploadGeneratedImage(imageBuffer);

  design.prompt = `${design.prompt || ''}\nRefine: ${prompt.trim()}`.trim();
  design.customImage = imageUrl;
  design.previewImage = imageUrl;
  design.status = 'DRAFT';
  await design.save();

  return { imageUrl, preview: imageUrl, designId: design._id, design };
};

const saveGeneratedDesign = async (designId, userId, role) => {
  const design = await getOwnedDesign(designId, userId, role);
  design.status = 'SAVED';
  await design.save();
  return design;
};

const clearGeneratedDesignHistory = async (userId) => {
  clearUserGenerationState(userId);
};

const getGeneratedDesignHistory = async (userId) => {
  return getUserGenerationHistory(userId);
};

const createOrderFromDesign = async (designId, userId, role, { shippingAddress, note, price } = {}) => {
  const design = await getOwnedDesign(designId, userId, role);

  const order = await Order.create({
    userId,
    items: [
      {
        designId: design._id,
        quantity: 1,
        price: Number(price || 0),
        name: `Custom design ${design._id}`,
        imageUrl: design.previewImage,
      },
    ],
    totalPrice: Number(price || 0),
    shippingAddress,
    note: note || `Custom design order: ${design._id}`,
    status: 'PENDING',
  });

  return order;
};

const uploadDesignImage = async (userId, files = {}, body = {}) => {
  const file = files.customImage?.[0] || files.previewImage?.[0] || files.image?.[0];
  if (!file) {
    const error = new Error('Image file is required.');
    error.statusCode = 400;
    throw error;
  }

  const mimeType = file.mimetype || 'image/jpeg';
  const dataUri = file.buffer
    ? `data:${mimeType};base64,${file.buffer.toString('base64')}`
    : file.path;
  const uploaded = await uploadImage(dataUri, 'altera/designs/uploads');
  const design = await Design.create({
    userId,
    shirtColor: body.shirtColor || 'white',
    prompt: body.prompt || null,
    customImage: uploaded.url,
    previewImage: uploaded.url,
    status: 'DRAFT',
  });

  return { imageUrl: uploaded.url, designId: design._id, design };
};

const getOwnedDesign = async (designId, userId, role) => {
  const design = await Design.findById(designId);

  if (!design) {
    const error = new Error('Design not found');
    error.statusCode = 404;
    throw error;
  }

  if (role !== 'ADMIN' && design.userId.toString() !== userId.toString()) {
    const error = new Error('Access denied. This design belongs to another user.');
    error.statusCode = 403;
    throw error;
  }

  return design;
};

module.exports = {
  generateDesign,
  refineDesign,
  saveGeneratedDesign,
  uploadDesignImage,
  createOrderFromDesign,
  clearGeneratedDesignHistory,
  getGeneratedDesignHistory,
};
