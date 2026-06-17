import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { AppConfig } from './types';

function getOrCreateSecret(): string {
  const existing = process.env.JWT_SECRET?.trim();

  if (existing) {
    return existing;
  }

  const newSecret = crypto.randomBytes(32).toString('hex');

  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `JWT_SECRET=${newSecret}\n`);
  }

  return newSecret;
}

const config: AppConfig = {
  appName: 'evercodelabs-internship',
  port: 3000,
  authToken: getOrCreateSecret()
};

export default config;