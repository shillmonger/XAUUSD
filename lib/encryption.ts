import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.DERIV_TOKEN_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

if (!ENCRYPTION_KEY) {
  throw new Error('DERIV_TOKEN_ENCRYPTION_KEY environment variable is required for token encryption');
}

/**
 * Derive a key from the environment variable using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(ENCRYPTION_KEY!, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns a base64-encoded string containing salt, IV, auth tag, and encrypted data
 */
export function encrypt(text: string): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(salt);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const textBuffer = Buffer.from(text, 'utf8');
    const encrypted = Buffer.concat([
      cipher.update(textBuffer),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Combine salt + iv + authTag + encrypted
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      encrypted
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    throw new Error('Encryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Decrypt data that was encrypted using the encrypt function
 */
export function decrypt(encryptedText: string): string {
  try {
    const combined = Buffer.from(encryptedText, 'base64');
    
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, TAG_POSITION);
    const authTag = combined.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = combined.slice(ENCRYPTED_POSITION);
    
    const key = deriveKey(salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Decryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}
