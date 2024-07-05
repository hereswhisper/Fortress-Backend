const crypto = require('crypto');

// Replace these values with your own secret key and initialization vector (IV)
const secretKey = 'fortnite_demon_fortnite_omma_123';
const ivBytes = [0x15, 0x90, 0x18, 0x41, 0x89, 0x73, 0x12, 0x75, 0x89, 0x12, 0x73, 0x89, 0x12, 0x37, 0x89, 0x12];
const iv = Buffer.from(ivBytes); // Convert the IV bytes to a Buffer


// Encrypt a string
function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Decrypt an encrypted string
function decrypt(encryptedText) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

module.exports = {
    encrypt,
    decrypt
}