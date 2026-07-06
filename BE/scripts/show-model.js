// Simple helper to show which AI model names the backend will use
const configured = ((process.env.CEREBRAS_MODEL || process.env.AI_MODEL) || '').trim();
const model = configured || 'gpt-oss-120b';
const imageModel = process.env.CEREBRAS_IMAGE_MODEL || 'cerebras-image-1';

console.log('Resolved Cerebras model:', model);
console.log('Resolved Cerebras image model:', imageModel);
console.log('CEREBRAS_API_KEY present:', Boolean(process.env.CEREBRAS_API_KEY));

// Also show legacy Gemini env presence (for local cleanup guidance)
console.log('Legacy GEMINI env present:', Boolean(process.env.GEMINI_API_KEY || process.env.GEMINI_MODEL));
