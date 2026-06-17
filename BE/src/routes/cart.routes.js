const express = require('express');
const router = express.Router();
const {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
  getWishlist, addToWishlist, removeFromWishlist,
} = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

// Cart
router.get('/cart', getCart);
router.post('/cart', addToCart);
router.put('/cart/:productId', updateCartItem);
router.delete('/cart/:productId', removeFromCart);
router.delete('/cart', clearCart);

// Wishlist
router.get('/wishlist', getWishlist);
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

module.exports = router;
