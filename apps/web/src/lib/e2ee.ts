/**
 * Client-Side End-to-End Encryption (E2EE) using WebCrypto AES-GCM 256.
 * The encryption key is stored in the URL hash fragment (#key=...)
 * and is NEVER transmitted to the server.
 */

// Convert ArrayBuffer to URL-safe base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Convert URL-safe base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  let str = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encryptText(plainText: string): Promise<{ cipherText: string; keyB64: string }> {
  // Generate a random 256-bit AES-GCM key
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Generate random 12-byte IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);

  // Encrypt
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    data as unknown as BufferSource
  );

  // Pack IV + Ciphertext together
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Export raw key to base64url
  const rawKey = await window.crypto.subtle.exportKey('raw', key);
  const keyB64 = bufferToBase64(rawKey);
  const cipherText = bufferToBase64(combined.buffer);

  return { cipherText, keyB64 };
}

export async function decryptText(cipherTextB64: string, keyB64: string): Promise<string> {
  const rawKeyBytes = base64ToBuffer(keyB64);
  const combinedBytes = base64ToBuffer(cipherTextB64);

  // Extract 12-byte IV and ciphertext
  const iv = combinedBytes.slice(0, 12);
  const ciphertext = combinedBytes.slice(12);

  // Import key
  const key = await window.crypto.subtle.importKey(
    'raw',
    rawKeyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
