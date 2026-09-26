const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { getCustomizationPrice } = require('../services/customization.service');

// ─── CART ────────────────────────────────────────────────────────────────────

const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name imageUrl price discountPrice stock colors sizes printingTechniques');
    res.status(200).json({ success: true, data: { cart: cart || { items: [], totalPrice: 0, totalItems: 0 } } });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, customization } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not found' });
    const selectedColor = customization && product.colors.find((item) => item.name === customization.color?.name);
    const selectedSize = customization && product.sizes.find((item) => item.label === customization.size);
    const availableStock = customization ? Math.min(product.stock, selectedColor?.stock ?? 0, selectedSize?.stock ?? 0) : product.stock;
    if (!Number.isInteger(quantity) || quantity < 1 || availableStock < quantity) return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${availableStock}` });
    const unitPrice = getCustomizationPrice(product, customization);

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) cart = new Cart({ userId: req.user._id, items: [] });

    const configKey = JSON.stringify(customization || null);
    const existingIndex = cart.items.findIndex((i) => i.productId.toString() === productId && JSON.stringify(i.customization?.toObject?.() || i.customization || null) === configKey);
    if (existingIndex >= 0) {
      if (cart.items[existingIndex].quantity + quantity > availableStock) {
        return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${availableStock}` });
      }
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, price: unitPrice, ...(customization && { customization }) });
    }

    await cart.save();
    res.status(200).json({ success: true, message: 'Added to cart', data: { cart } });
  } catch (error) {
    next(error);
  }
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
      if (product) line.price = getCustomizationPrice(product, line.customization?.toObject?.() || line.customization);
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

// ─── WISHLIST ─────────────────────────────────────────────────────────────────

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
