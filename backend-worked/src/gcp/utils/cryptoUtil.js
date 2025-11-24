const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = Buffer.from(process.env.CRYPTO_SECRET_KEY, 'utf8');
const IV = Buffer.from(process.env.CRYPTO_IV, 'utf8');

exports.encrypt = (data) => {
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, IV);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { encrypted, authTag };
};

exports.decrypt = (encrypted, authTag) => {
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, IV);
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
