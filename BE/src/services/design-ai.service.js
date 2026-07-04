const Design = require('../models/Design');
const Order = require('../models/Order');
const { uploadImage } = require('../utils/cloudinary');

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

const buildPollinationsPromptSegment = (prompt) => encodeURIComponent(normalizePrompt(prompt));

const buildPollinationsCurlCommand = (prompt, filename = 'test.png') => {
  const encodedPrompt = buildPollinationsPromptSegment(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&model=flux&nologo=true`;
  return `curl -o ${filename} "${url}"`;
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

const buildDesignPrompt = ({ prompt, style, shirtType, colorPalette }) => {
  const pieces = [
    'Create a high-quality fashion print design suitable for screen printing or direct-to-garment printing on a shirt.',
    `Design prompt: ${prompt.trim()}.`,
  ];

  if (style) pieces.push(`Style reference: ${style}.`);
  if (shirtType) pieces.push(`Shirt type: ${shirtType}.`);
  if (colorPalette) pieces.push(`Preferred color palette: ${colorPalette}.`);
  pieces.push('Generate a clean PNG image only. Do not include explanatory text.');

  return pieces.join(' ');
};

const fetchPollinationsImage = async (prompt) => {
  const encodedPrompt = buildPollinationsPromptSegment(prompt);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&model=flux&nologo=true`;

  const response = await fetch(pollinationsUrl);
  if (!response.ok) {
    throw new Error('Pollinations image generation failed');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
};

const uploadGeneratedImage = async (imageBuffer) => {
  const dataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;
  const uploaded = await uploadImage(dataUri, 'designs/generated');
  return uploaded.url;
};

const generateDesign = async (userId, payload) => {
  const prompt = normalizePrompt(payload.prompt);
  if (!prompt) {
    const error = new Error('Prompt is required to generate a design.');
    error.statusCode = 400;
    throw error;
  }

  if (!canGenerateNow(userId)) {
    const error = new Error('Please wait 15 seconds before generating another image.');
    error.statusCode = 429;
    throw error;
  }

  const curlCommand = buildPollinationsCurlCommand(prompt, payload.filename || 'test.png');
  const imageBuffer = await fetchPollinationsImage(buildDesignPrompt({
    prompt,
    style: payload.style,
    shirtType: payload.shirtType,
    colorPalette: payload.colorPalette,
  }));
  const imageUrl = await uploadGeneratedImage(imageBuffer);

  const design = await Design.create({
    userId,
    shirtColor: payload.shirtColor || payload.colorPalette || 'white',
    prompt,
    style: payload.style || null,
    shirtType: payload.shirtType || null,
    colorPalette: payload.colorPalette || null,
    customImage: imageUrl,
    previewImage: imageUrl,
    status: 'DRAFT',
  });

  const history = addGeneratedImageToHistory(userId, {
    prompt,
    imageUrl,
    curlCommand,
    createdAt: new Date().toISOString(),
  });

  return {
    imageUrl,
    preview: imageUrl,
    curlCommand,
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
  const imageBuffer = await fetchPollinationsImage(
    buildDesignPrompt({
      prompt: `${design.prompt || 'Existing shirt design'}. Refine request: ${prompt.trim()}`,
      style: design.style,
      shirtType: design.shirtType,
      colorPalette: design.colorPalette,
    })
  );
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
