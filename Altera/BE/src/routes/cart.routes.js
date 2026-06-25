const express = require('express');
const router = express.Router();
const {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
  getWishlist, addToWishlist, removeFromWishlist,
} = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: Get user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/cart', getCart);

/**
 * @swagger
 * /api/v1/cart:
 *   post:
 *     summary: Add item to cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Item added to cart
 *       401:
 *         description: Unauthorized
 */
router.post('/cart', addToCart);

/**
 * @swagger
 * /api/v1/cart/{productId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cart item updated
 */
router.put('/cart/:productId', updateCartItem);

/**
 * @swagger
 * /api/v1/cart/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.delete('/cart/:productId', removeFromCart);

/**
 * @swagger
 * /api/v1/cart:
 *   delete:
 *     summary: Clear entire cart
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/cart', clearCart);

/**
 * @swagger
 * /api/v1/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
router.get('/wishlist', getWishlist);

/**
 * @swagger
 * /api/v1/wishlist:
 *   post:
 *     summary: Add item to wishlist
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added to wishlist
 */
router.post('/wishlist', addToWishlist);

/**
 * @swagger
 * /api/v1/wishlist/{productId}:
 *   delete:
 *     summary: Remove item from wishlist
 *     tags:
 *       - Wishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from wishlist
 */
router.delete('/wishlist/:productId', removeFromWishlist);

module.exports = router;
