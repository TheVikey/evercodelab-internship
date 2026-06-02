require('dotenv').config();
const crypto = require('crypto');

function getOrCreateSecret() {
  const existing = process.env.JWT_SECRET?.trim();
  
  if (existing) {
    return existing;
  }
  const newSecret = crypto.randomBytes(32).toString('hex');

  const fs = require('fs');
  const path = require('path');

  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `JWT_SECRET=${newSecret}\n`);
  }

  return newSecret;
}
const config = {
  appName: "evercodelabs-internship",
  port: 3000,
  authToken: getOrCreateSecret()
};

module.exports = config;