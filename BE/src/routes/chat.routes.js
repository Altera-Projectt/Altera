const express = require('express');
const router = express.Router();
const { createChat, getChats, getChatById, sendMessage, deleteChat, clearChat } = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/chats:
 *   get:
 *     summary: Get all chats of current user
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chats retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', getChats);

/**
 * @swagger
 * /api/v1/chats:
 *   post:
 *     summary: Create a new chat session
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My Chat"
 *               topic:
 *                 type: string
 *                 enum: [fashion, outfit, style, general]
 *                 example: "outfit"
 *     responses:
 *       201:
 *         description: Chat created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', createChat);

/**
 * @swagger
 * /api/v1/chats/{id}:
 *   get:
 *     summary: Get a single chat by ID
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat retrieved successfully
 *       404:
 *         description: Chat not found
 */
router.get('/:id', getChatById);

/**
 * @swagger
 * /api/v1/chats/{id}/message:
 *   post:
 *     summary: Send a message to a chat
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Gợi ý outfit cho mùa hè"
 *     responses:
 *       200:
 *         description: Message sent and AI replied
 *       404:
 *         description: Chat not found
 */
router.post('/:id/message', sendMessage);

/**
 * @swagger
 * /api/v1/chats/{id}/clear:
 *   delete:
 *     summary: Clear all messages in a chat
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat messages cleared
 *       404:
 *         description: Chat not found
 */
router.delete('/:id/clear', clearChat);

/**
 * @swagger
 * /api/v1/chats/{id}:
 *   delete:
 *     summary: Delete a chat session
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 *       404:
 *         description: Chat not found
 */
router.delete('/:id', deleteChat);

module.exports = router;
