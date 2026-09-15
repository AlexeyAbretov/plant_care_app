import mongoose from 'mongoose';

import { config } from './config.js';

export async function connectDb(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB: подключено');
  } catch (error) {
    console.error('MongoDB: ошибка подключения', error);
    process.exit(1);
  }
}
