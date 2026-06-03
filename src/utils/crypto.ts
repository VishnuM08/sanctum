/**
 * Browser-side AES-GCM Encryption / Decryption Utilities
 * Uses standard Web Crypto API.
 */

// Helper to convert array buffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert base64 to array buffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Derives an AES-GCM 256-bit key from a password and salt using PBKDF2
 */
async function getEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string with a password using AES-GCM 256.
 * Returns a base64 encoded string containing: salt (16 bytes) + iv (12 bytes) + ciphertext.
 */
export async function encryptData(plainText: string, password: string): Promise<string> {
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getEncryptionKey(password, salt);

    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      enc.encode(plainText)
    );

    // Pack: Salt (16 bytes) + IV (12 bytes) + CipherText
    const encryptedData = new Uint8Array(salt.byteLength + iv.byteLength + cipherBuffer.byteLength);
    encryptedData.set(salt, 0);
    encryptedData.set(iv, salt.byteLength);
    encryptedData.set(new Uint8Array(cipherBuffer), salt.byteLength + iv.byteLength);

    return arrayBufferToBase64(encryptedData.buffer);
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts a base64 encoded ciphertext string with a password using AES-GCM 256.
 */
export async function decryptData(cipherTextBase64: string, password: string): Promise<string> {
  try {
    const encryptedData = new Uint8Array(base64ToArrayBuffer(cipherTextBase64));
    
    if (encryptedData.byteLength < 28) {
      throw new Error('Invalid cipher text length');
    }

    const salt = encryptedData.slice(0, 16);
    const iv = encryptedData.slice(16, 28);
    const cipherText = encryptedData.slice(28);

    const key = await getEncryptionKey(password, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      cipherText
    );

    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('Decryption failed. Please check your password.');
  }
}
