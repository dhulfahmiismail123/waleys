import dotenv from 'dotenv';
dotenv.config();

export const DB_PATH =process.env.DB_PATH || './WhatsappStore.db';
export const METHOD_LOGIN = process.env.METHOD_LOGIN || 'qr';