const express = require('express');
const router = express.Router();
const { recommend, getHistory } = require('../controllers/outfit.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

/**
 * @swagger
 * /api/v1/outfits/recommend:
 *   post:
 *     summary: Get AI outfit recommendation
 *     tags:
 *       - Outfits
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               top:
 *                 type: string
 *                 example: "White shirt"
 *               bottom:
 *                 type: string
 *                 example: "Black trousers"
 *               shoes:
 *                 type: string
 *                 example: "White sneakers"
 *               accessories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["watch", "belt"]
 *               occasion:
 *                 type: string
 *                 example: "Đi làm"
 *               style:
 *                 type: string
 *                 example: "Streetwear"
 *               budget:
 *                 type: number
 *                 example: 500000
 *               preferences:
 *                 type: string
 *                 example: "Màu tối, phong cách đơn giản"
 *     responses:
 *       200:
 *         description: AI outfit recommendation returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestion:
 *                       type: string
 *                     tips:
 *                       type: array
 *                       items:
 *                         type: string
 *                     styleScore:
 *                       type: number
 *                     improvements:
 *                       type: string
 *                     recordId:
 *                       type: string
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 */
router.post('/recommend', recommend);

/**
 * @swagger
 * /api/v1/outfits/history:
 *   get:
 *     summary: Get outfit recommendation history of current user
 *     tags:
 *       - Outfits
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendation history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/history', getHistory);

module.exports = router;
