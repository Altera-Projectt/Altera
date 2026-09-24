require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/outfit_ai_db',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },
  CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
  CEREBRAS_BASE_URL: process.env.CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1',
  PAYMENT_ENV: process.env.PAYMENT_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  MOMO_RETURN_URL: process.env.MOMO_RETURN_URL,
  BANK_CODE: process.env.BANK_CODE,
  BANK_NAME: process.env.BANK_NAME,
  BANK_ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER,
  BANK_ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME,
  PAYMENT_WEBHOOK_TOKEN: process.env.PAYMENT_WEBHOOK_TOKEN,
  MOMO_PARTNER_CODE: process.env.MOMO_PARTNER_CODE,
  MOMO_ACCESS_KEY: process.env.MOMO_ACCESS_KEY,
  MOMO_SECRET_KEY: process.env.MOMO_SECRET_KEY,
  MOMO_ENDPOINT: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
  MOMO_IPN_URL: process.env.MOMO_IPN_URL,
};
