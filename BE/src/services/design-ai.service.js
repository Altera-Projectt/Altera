const Design = require('../models/Design');
const Order = require('../models/Order');
const geminiService = require('./gemini.service');
const { uploadImage } = require('../utils/cloudinary');

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

const uploadGeneratedImage = async ({ mimeType, data }) => {
  const dataUri = `data:${mimeType || 'image/png'};base64,${data}`;
  const uploaded = await uploadImage(dataUri, 'designs/generated');
  return uploaded.url;
};

const generateDesign = async (userId, payload) => {
  if (!payload.prompt || typeof payload.prompt !== 'string' || !payload.prompt.trim()) {
    const error = new Error('Prompt is required to generate a design.');
    error.statusCode = 400;
    throw error;
  }

  const imageResult = await geminiService.generateImage(buildDesignPrompt(payload));
  const imageUrl = await uploadGeneratedImage(imageResult);

  const design = await Design.create({
    userId,
    shirtColor: payload.shirtColor || payload.colorPalette || 'white',
    prompt: payload.prompt.trim(),
    style: payload.style || null,
    shirtType: payload.shirtType || null,
    colorPalette: payload.colorPalette || null,
    customImage: imageUrl,
    previewImage: imageUrl,
    status: 'DRAFT',
  });

  return {
    imageUrl,
    preview: imageUrl,
    designId: design._id,
    design,
  };
};

const refineDesign = async (designId, userId, role, { prompt }) => {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    const error = new Error('Prompt is required to refine a design.');
    error.statusCode = 400;
    throw error;
  }

  const design = await getOwnedDesign(designId, userId, role);
  const imageResult = await geminiService.generateImage(
    buildDesignPrompt({
      prompt: `${design.prompt || 'Existing shirt design'}. Refine request: ${prompt.trim()}`,
      style: design.style,
      shirtType: design.shirtType,
      colorPalette: design.colorPalette,
    })
  );
  const imageUrl = await uploadGeneratedImage(imageResult);

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

  const uploaded = await uploadImage(file.path, 'designs/uploads');
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
};
