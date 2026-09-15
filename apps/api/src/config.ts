import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3001),
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/plant_care',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
};
