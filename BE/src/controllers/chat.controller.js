const chatService = require('../services/chat.service');

/**
 * Create new chat
 */
const createChat = async (req, res, next) => {
  try {
    const { title, topic } = req.body;
    const chat = await chatService.createChat(req.user._id, { title, topic });

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: { chat },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all user chats
 */
const getChats = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await chatService.getUserChats(req.user._id, { page, limit });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single chat by ID
 */
const getChatById = async (req, res, next) => {
  try {
    const chat = await chatService.getChatById(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      data: { chat },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send message to chat
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

    const wantsStream = req.headers.accept?.includes('text/event-stream') || req.query.stream === '1';

    if (wantsStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const result = await chatService.sendMessage(req.params.id, req.user._id, message.trim(), {
        stream: true,
        onChunk: (chunk) => {
          res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
        },
      });

      res.write(`data: ${JSON.stringify({ type: 'done', text: result.aiMessage.text })}\n\n`);
      res.end();
      return;
    }

    const result = await chatService.sendMessage(req.params.id, req.user._id, message.trim());

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete chat
 */
const deleteChat = async (req, res, next) => {
  try {
    const result = await chatService.deleteChat(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear chat messages
 */
const clearChat = async (req, res, next) => {
  try {
    const chat = await chatService.clearChat(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Chat cleared successfully',
      data: { chat },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createChat, getChats, getChatById, sendMessage, deleteChat, clearChat };
