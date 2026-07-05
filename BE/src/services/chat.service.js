const Chat = require('../models/Chat');
const cerebrasService = require('./cerebras.service');

/**
 * Create a new chat conversation
 */
const createChat = async (userId, { title, topic } = {}) => {
  const chat = await Chat.create({
    userId,
    title: title || `Chat - ${new Date().toLocaleDateString()}`,
    topic: topic || 'general',
    messages: [],
  });
  return chat;
};

/**
 * Get all conversations for user
 */
const getUserChats = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const [chats, total] = await Promise.all([
    Chat.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).select('-messages'),
    Chat.countDocuments({ userId }),
  ]);

  return {
    chats,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single chat with all messages
 */
const getChatById = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    const error = new Error('Chat not found');
    error.statusCode = 404;
    throw error;
  }

  if (chat.userId.toString() !== userId.toString()) {
    const error = new Error('Access denied. This chat belongs to another user.');
    error.statusCode = 403;
    throw error;
  }

  return chat;
};

/**
 * Send message and get AI response
 */
const sendMessage = async (chatId, userId, userMessage, options = {}) => {
  const chat = await getChatById(chatId, userId);

  chat.messages.push({
    sender: 'USER',
    text: userMessage,
  });

  const aiResponse = await generateAIResponse(userMessage, chat.messages, chat.topic, options);

  chat.messages.push({
    sender: 'AI',
    text: aiResponse,
  });

  if (chat.messages.length === 2) {
    const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
    chat.title = title;
  }

  await chat.save();
  return {
    userMessage: chat.messages[chat.messages.length - 2],
    aiMessage: chat.messages[chat.messages.length - 1],
  };
};

/**
 * Generate AI response using Cerebras API
 */
const generateAIResponse = async (userMessage, messageHistory, topic = 'general', options = {}) => {
  const systemPrompt = getSystemPrompt(topic);
  const recentHistory = messageHistory.slice(-10);
  const historyWithoutCurrent =
    recentHistory.length > 0 && recentHistory[recentHistory.length - 1].sender === 'USER'
      ? recentHistory.slice(0, -1)
      : recentHistory;

  return cerebrasService.sendChatMessage(systemPrompt, historyWithoutCurrent, userMessage, options);
};

/**
 * Get system prompt based on topic
 */
const getSystemPrompt = (topic) => {
  const prompts = {
    fashion: `You are a professional fashion consultant and stylist. Help users with:
- Fashion advice and recommendations
- Outfit styling tips
- Color coordination
- Fabric and material guidance
- Trends and style choices
Be friendly, professional, and provide practical advice. Keep responses concise (under 300 words).`,

    outfit: `You are an expert outfit advisor. Help users with:
- Outfit composition and balance
- Occasion-appropriate dressing
- Style score and feedback
- Improvement suggestions
- Item recommendations
Be enthusiastic and supportive. Keep responses concise (under 300 words).`,

    style: `You are a style coach helping users discover their personal style. Help with:
- Personal style discovery
- Style preferences and inspirations
- Wardrobe planning
- Style evolution
- Confidence building
Be encouraging and personalized. Keep responses concise (under 300 words).`,

    general: `You are a helpful fashion and lifestyle assistant. You can discuss:
- Fashion and style topics
- Clothing recommendations
- Fashion trends
- General lifestyle advice
Be conversational, friendly, and helpful. Keep responses concise (under 300 words).`,
  };

  return prompts[topic] || prompts.general;
};

/**
 * Delete chat
 */
const deleteChat = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    const error = new Error('Chat not found');
    error.statusCode = 404;
    throw error;
  }

  if (chat.userId.toString() !== userId.toString()) {
    const error = new Error('Access denied.');
    error.statusCode = 403;
    throw error;
  }

  await Chat.findByIdAndDelete(chatId);
  return { message: 'Chat deleted successfully' };
};

/**
 * Clear all messages in chat
 */
const clearChat = async (chatId, userId) => {
  const chat = await getChatById(chatId, userId);
  chat.messages = [];
  await chat.save();
  return chat;
};

module.exports = {
  createChat,
  getUserChats,
  getChatById,
  sendMessage,
  deleteChat,
  clearChat,
};
