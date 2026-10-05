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

const buildStyleModifier = (style = '') => {
  switch (style.toLowerCase().trim()) {
    case 'watercolor':
      return 'Use expressive watercolor splashes, fluid brushstrokes, and soft color blending. Edges can be organic and naturally fading. Layered translucent washes of color, wet-on-wet bleeding effects, and delicate paper texture grain.';
    case 'vintage illustration':
      return 'Apply a retro aesthetic with distressed textures, faded and desaturated colors, cross-hatching, and classic 1970s–1980s graphic illustration techniques. Include halftone dot grain, ink-stamp imperfections, and a worn, timeworn quality.';
    case 'streetwear bold':
      return 'Use large bold graphic shapes, extreme high-contrast colors, heavy black outlines, and aggressive typography energy. Inspired by 90s streetwear and skate graphics — loud, dominant, and unapologetically impactful.';
    case 'minimalist line art':
      return 'Use extreme simplicity with elegant single-weight or variable-weight line work on ample negative space. Vector-clean precision, no fills, just flowing continuous contour lines. Refined, editorial, and architectural in feel.';
    case 'anime / manga':
      return 'Use vibrant cel-shaded colors, dynamic action poses, manga-style speed lines, bold ink outlines, and expressive Japanese anime / manga illustration conventions. Dramatic lighting, heroic energy, and iconic character composition.';
    case 'abstract':
      return 'Employ bold geometric abstraction: intersecting planes, kinetic motion trails, deconstructed organic forms, and a visually striking non-representational composition. Heavily influenced by Bauhaus, Swiss International Style, and contemporary digital art.';
    case 'graphic art':
    default:
      return 'Produce a masterfully crafted vector-style graphic artwork. Strong silhouettes, deliberate color blocking, clear print-ready lines, high visual impact, and a professional illustration finish suitable for premium garment printing.';
  }
};

const buildDesignPrompt = ({ idea, style, globalShirtColor }) => {
  const styleModifier = buildStyleModifier(style);
  return `Create a breathtaking, high-quality graphic design intended to be printed on a t-shirt.

USER'S CORE CONCEPT: "${idea}"
ART STYLE: "${style}"
SHIRT BASE COLOR: "${globalShirtColor}"

SPECIFIC STYLE INSTRUCTIONS:
- ${styleModifier}

TECHNICAL & PRINTING REQUIREMENTS:
- Create ONLY the graphic artwork. DO NOT generate a picture of a t-shirt, a mockup, or a person wearing clothing.
- The design must function as a standalone decal or print graphic.
- Use a pure, solid background color that contrasts heavily with the main artwork to allow for easy background removal later.
- Do not let the artwork bleed out to the absolute edges of the image; leave a small safe margin.
- The artwork's color palette must be visible and contrast well against the base shirt color (${globalShirtColor}).
- Do NOT add random text, letters, logos, or watermarks unless explicitly requested in the user's concept.
- Center the main artwork. Use strong silhouettes, clean edges, and print-friendly forms.
- The artwork should look intentional, artistically excellent, and professionally designed.

IMPORTANT: The final result is artwork intended to be placed ON a t-shirt. It is NOT a picture of a t-shirt.
Focus entirely on executing the user's concept with the highest artistic quality and creativity.`;
};

const generateOpenAIImage = async (prompt) => {
  if (!process.env.OPENAI_API_KEY) {
    logger.error('OpenAI image generation unavailable: OPENAI_API_KEY is not configured.');
    const error = new Error('OpenAI API key is not configured.');
    error.statusCode = 401;
    throw error;
  }
  try {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
    let model = process.env.IMAGE_MODEL || 'gpt-image-2';
    const result = await openai.images.generate({ model, prompt, quality: process.env.IMAGE_QUALITY || 'low', size: process.env.IMAGE_SIZE || '1024x1024', output_format: 'png', n: 1 });
    if (!result.data?.[0]?.b64_json) throw new Error('OpenAI returned no image data.');
    logger.info(`OpenAI image generation succeeded: model=${model} size=${process.env.IMAGE_SIZE || '1024x1024'} n=1`);
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
