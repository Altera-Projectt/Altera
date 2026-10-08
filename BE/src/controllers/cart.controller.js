const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const MarketplaceDesign = require('../models/MarketplaceDesign');
const { getCustomizationPrice } = require('../services/customization.service');

// ─── CART ───────────────────────────────────────────────────────────────────

const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name imageUrl price discountPrice stock colors sizes printingTechniques').populate('items.marketplaceDesignId', 'name slug thumbnail price status');
    res.status(200).json({ success: true, data: { cart: cart || { items: [], totalPrice: 0, totalItems: 0 } } });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { quantity = 1 } = req.body;
    let { productId, customization } = req.body;
    let marketplaceDesign = null;
    if (req.body.marketplaceDesignId) {
      marketplaceDesign = await MarketplaceDesign.findOne({ _id: req.body.marketplaceDesignId, status: 'PUBLISHED' });
      if (!marketplaceDesign) return res.status(404).json({ success: false, message: 'Published design not found' });
      productId = marketplaceDesign.productId;
      customization = { ...(customization || {}), printSide: marketplaceDesign.printSide, printingTechnique: marketplaceDesign.printingTechnique, frontDesign: marketplaceDesign.frontDesign, backDesign: marketplaceDesign.backDesign };
    }
    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not found' });
    if (marketplaceDesign && (!customization?.color?.name || !customization?.size)) {
      return res.status(400).json({ success: false, message: 'Choose a product color and size.' });
    }
    const selectedColor = customization && product.colors.find((item) => item.name === customization.color?.name);
    const selectedSize = customization && product.sizes.find((item) => item.label === customization.size);
    if (marketplaceDesign && (!selectedColor || customization.color.hex !== selectedColor.hex || !selectedSize)) {
      return res.status(400).json({ success: false, message: 'Choose an available product color and size.' });
    }
    const availableStock = customization ? Math.min(product.stock, selectedColor?.stock ?? 0, selectedSize?.stock ?? 0) : product.stock;
    if (!Number.isInteger(quantity) || quantity < 1 || availableStock < quantity) return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${availableStock}` });
    const unitPrice = marketplaceDesign ? marketplaceDesign.price : getCustomizationPrice(product, customization);
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) cart = new Cart({ userId: req.user._id, items: [] });
    const configKey = JSON.stringify(customization || null);
    const existingIndex = cart.items.findIndex((i) => i.productId.toString() === String(productId) && String(i.marketplaceDesignId || '') === String(marketplaceDesign?._id || '') && JSON.stringify(i.customization?.toObject?.() || i.customization || null) === configKey);
    if (existingIndex >= 0) {
      if (cart.items[existingIndex].quantity + quantity > availableStock) return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${availableStock}` });
      cart.items[existingIndex].quantity += quantity;
    } else cart.items.push({ productId, marketplaceDesignId: marketplaceDesign?._id || null, quantity, price: unitPrice, ...(customization && { customization }) });
    await cart.save();
    res.status(200).json({ success: true, message: 'Added to cart', data: { cart } });
  } catch (error) { next(error); }
};
const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    let index = cart.items.findIndex((i) => String(i._id) === productId);
    if (index < 0) index = cart.items.findIndex((i) => i.productId.toString() === productId);
    if (index < 0) return res.status(404).json({ success: false, message: 'Item not in cart' });

    if (quantity <= 0) {
      cart.items.splice(index, 1);
    } else {
      const line = cart.items[index];
      const product = await Product.findById(line.productId);
      const color = line.customization && product?.colors.find((item) => item.name === line.customization.color.name);
      const size = line.customization && product?.sizes.find((item) => item.label === line.customization.size);
      if (!Number.isInteger(quantity) || (line.customization ? Math.min(product?.stock ?? 0, color?.stock ?? 0, size?.stock ?? 0) : product?.stock ?? 0) < quantity) {
        return res.status(400).json({ success: false, message: 'Quantity exceeds available stock' });
      }
      if (line.marketplaceDesignId) { const listing = await MarketplaceDesign.findOne({ _id: line.marketplaceDesignId, status: 'PUBLISHED' }); if (!listing) return res.status(400).json({ success: false, message: 'A design in your cart is no longer available.' }); line.price = listing.price; } else if (product) line.price = getCustomizationPrice(product, line.customization?.toObject?.() || line.customization);
      cart.items[index].quantity = quantity;
    }

    await cart.save();
    res.status(200).json({ success: true, message: 'Cart updated', data: { cart } });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const hasLineId = cart.items.some((i) => String(i._id) === productId);
    cart.items = cart.items.filter((i) => hasLineId ? String(i._id) !== productId : i.productId.toString() !== productId);
    await cart.save();
    res.status(200).json({ success: true, message: 'Item removed from cart', data: { cart } });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};

// ─── WISHLIST ────────────────────────────────────────────────────────────────

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id }).populate('products', 'name imageUrl price category');
    res.status(200).json({ success: true, data: { wishlist: wishlist || { products: [] } } });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not found' });

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: req.user._id },
      { $addToSet: { products: productId } },
      { upsert: true, new: true }
    ).populate('products', 'name imageUrl price category');

    res.status(200).json({ success: true, message: 'Added to wishlist', data: { wishlist } });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { products: productId } },
      { new: true }
    ).populate('products', 'name imageUrl price category');

    res.status(200).json({ success: true, message: 'Removed from wishlist', data: { wishlist } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
  getWishlist, addToWishlist, removeFromWishlist,
};
