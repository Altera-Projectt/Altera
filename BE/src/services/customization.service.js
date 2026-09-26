const fail = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
};

const getCustomizationPrice = (product, customization) => {
  if (!customization) return product.price;

  const color = product.colors.find((item) => item.name === customization.color?.name);
  const size = product.sizes.find((item) => item.label === customization.size);
  const technique = product.printingTechniques.find((item) => item.code === customization.printingTechnique);
  if (!color || !size || !technique || !['FRONT', 'BACK', 'BOTH'].includes(customization.printSide)) {
    fail('Choose an available product color, size, print side, and printing technique.');
  }
  if (customization.color.hex !== color.hex) fail('Selected color is no longer available.');

  const front = customization.frontDesign?.layers || [];
  const back = customization.backDesign?.layers || [];
  if (!Array.isArray(front) || !Array.isArray(back) || front.length > 30 || back.length > 30) {
    fail('A design may contain at most 30 layers per side.');
  }
  for (const layer of [...front, ...back]) {
    if (layer?.type === 'text' && typeof layer.text === 'string' && layer.text.length <= 500) continue;
    if (layer?.type === 'image' && typeof layer.src === 'string' && layer.src.length <= 7_000_000 && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(layer.src)) continue;
    fail('A design contains an invalid text or image layer.');
  }
  const hasFront = front.length > 0;
  const hasBack = back.length > 0;
  if ((customization.printSide === 'FRONT' && !hasFront) || (customization.printSide === 'BACK' && !hasBack) || (customization.printSide === 'BOTH' && (!hasFront || !hasBack))) {
    fail('Add a design to each selected print side.');
  }

  return (product.discountPrice || product.price) + technique.price + (customization.printSide === 'BOTH' ? technique.additionalSidePrice : 0) + (technique.customizationPrice || 0);
};

module.exports = { getCustomizationPrice };
