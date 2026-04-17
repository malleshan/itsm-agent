import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || 'itsm-default-32-byte-secret-key!';
  return Buffer.from(secret.padEnd(32).slice(0, 32));
}

/** AES-256-GCM encrypt. Returns base64 string: iv:tag:ciphertext */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

/** AES-256-GCM decrypt. Accepts iv:tag:ciphertext format */
export function decrypt(ciphertext: string): string {
  if (!ciphertext || !ciphertext.includes(':')) return ciphertext;
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/** Recursively encrypt all string leaf values in a credentials object. */
export function encryptCredentials(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      result[k] = encrypt(v);
    } else if (v && typeof v === 'object') {
      result[k] = encryptCredentials(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}

/** Recursively decrypt all string leaf values in a credentials object. */
export function decryptCredentials(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      try {
        result[k] = decrypt(v);
      } catch {
        result[k] = v; // not encrypted, return as-is
      }
    } else if (v && typeof v === 'object') {
      result[k] = decryptCredentials(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}
