/**
 * Vault encryption — real AES-256-GCM via the Web Crypto API.
 *
 * Security model (be honest about it):
 *   • Master password → PBKDF2 (210k iterations, SHA-256) → AES-256-GCM key.
 *   • The derived key is NON-EXTRACTABLE and lives only in memory. It is never
 *     written to localStorage. On reload the vault is locked and the master
 *     password must be re-entered.
 *   • Each entry is encrypted independently with a fresh random 12-byte IV.
 *     Stored value = base64(iv ‖ ciphertext+gcmTag). GCM authenticates, so a
 *     wrong key (or tampered blob) throws on decrypt rather than returning junk.
 *   • A "verifier" blob (a known string) is stored so we can check the master
 *     password on unlock without keeping the password around.
 *
 * This is genuine encryption — but it is still a browser-local prototype.
 * Don't store your most critical credentials here; use a dedicated manager
 * for those. Losing the master password means the data is unrecoverable.
 */

const PBKDF2_ITERATIONS = 210_000;
const VERIFIER_PLAINTEXT = 'notebook-vault-verifier-v1';

const enc = new TextEncoder();
const dec = new TextDecoder();

// ── base64 helpers (binary-safe) ────────────────────────────────────────────

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ── Key derivation ───────────────────────────────────────────────────────────

export function generateSalt(): string {
  return bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveKey(masterPassword: string, saltB64: string): Promise<CryptoKey> {
  const salt = b64ToBytes(saltB64);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,                 // non-extractable — key can never be read out via JS
    ['encrypt', 'decrypt'],
  );
}

// ── Encrypt / decrypt ─────────────────────────────────────────────────────────

export async function encryptString(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    enc.encode(plaintext) as BufferSource,
  );
  const ctBytes = new Uint8Array(ct);
  const combined = new Uint8Array(iv.length + ctBytes.length);
  combined.set(iv, 0);
  combined.set(ctBytes, iv.length);
  return bytesToB64(combined);
}

export async function decryptString(blobB64: string, key: CryptoKey): Promise<string> {
  const combined = b64ToBytes(blobB64);
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ct as BufferSource,
  );
  return dec.decode(pt);
}

// ── Verifier (master-password check) ─────────────────────────────────────────

export async function makeVerifier(key: CryptoKey): Promise<string> {
  return encryptString(VERIFIER_PLAINTEXT, key);
}

export async function checkVerifier(verifierB64: string, key: CryptoKey): Promise<boolean> {
  try {
    const out = await decryptString(verifierB64, key);
    return out === VERIFIER_PLAINTEXT;
  } catch {
    return false; // GCM auth failure → wrong password
  }
}

// ── Password generator ───────────────────────────────────────────────────────

export interface PwGenOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export function generatePassword(opts: PwGenOptions): string {
  const sets: string[] = [];
  if (opts.lowercase) sets.push('abcdefghijkmnpqrstuvwxyz');     // no l
  if (opts.uppercase) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ');     // no I, O
  if (opts.numbers)   sets.push('23456789');                    // no 0, 1
  if (opts.symbols)   sets.push('!@#$%^&*()-_=+[]{};:,.?');
  const all = sets.join('');
  if (!all) return '';

  const len = Math.max(4, Math.min(64, opts.length));
  const out: string[] = [];

  // Guarantee at least one char from each selected set
  for (const set of sets) {
    out.push(set[randIndex(set.length)]);
  }
  while (out.length < len) {
    out.push(all[randIndex(all.length)]);
  }
  // Fisher–Yates shuffle with crypto randomness
  for (let i = out.length - 1; i > 0; i--) {
    const j = randIndex(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, len).join('');
}

function randIndex(max: number): number {
  // Rejection sampling for unbiased index in [0, max)
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let n: number;
  do { crypto.getRandomValues(buf); n = buf[0]; } while (n >= limit);
  return n % max;
}

// ── Strength estimate (rough, for the meter) ─────────────────────────────────

export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let variety = 0;
  if (/[a-z]/.test(pw)) variety++;
  if (/[A-Z]/.test(pw)) variety++;
  if (/[0-9]/.test(pw)) variety++;
  if (/[^a-zA-Z0-9]/.test(pw)) variety++;

  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (variety >= 3)    score++;
  score = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;

  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}
