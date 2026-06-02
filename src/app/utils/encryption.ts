// Simple client-side encryption (for demo purposes)
// In production, use a proper library like crypto-js

export function encrypt(text: string, key: string = 'vault-secret-key'): string {
  // Simple XOR encryption for demo
  let encrypted = '';
  for (let i = 0; i < text.length; i++) {
    encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted); // Base64 encode
}

export function decrypt(encrypted: string, key: string = 'vault-secret-key'): string {
  try {
    const decoded = atob(encrypted); // Base64 decode
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  } catch {
    return encrypted; // Return as-is if decryption fails
  }
}

export function generateKey(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
}
