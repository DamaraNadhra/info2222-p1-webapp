import nacl from 'tweetnacl';

// --- E2EE Utility Functions ---
// These functions are used for encrypting and decrypting messages in the chat app.
// All encryption uses the NaCl (tweetnacl) box API for public-key authenticated encryption.

// Generate a new key pair for a user (publicKey, secretKey)
export function generateKeyPair() {
  // Returns { publicKey: Uint8Array, secretKey: Uint8Array }
  return nacl.box.keyPair();
}

// Encrypt a message using the recipient's public key and sender's secret key
// Returns the encrypted message and the nonce used
export function encryptMessage(
  message: string,
  recipientPublicKey: Uint8Array,
  senderSecretKey: Uint8Array
): { encrypted: Uint8Array; nonce: Uint8Array } {
  // Convert message to Uint8Array
  const messageBytes = new TextEncoder().encode(message);
  // Generate a random nonce (required for NaCl box)
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  // Encrypt the message
  const encrypted = nacl.box(
    messageBytes,
    nonce,
    recipientPublicKey,
    senderSecretKey
  );
  return { encrypted, nonce };
}

// Decrypt a message using the sender's public key and recipient's secret key
// Returns the original plaintext message as a string
export function decryptMessage(
  encrypted: Uint8Array,
  nonce: Uint8Array,
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array
): string {
  // Decrypt the message
  const decrypted = nacl.box.open(
    encrypted,
    nonce,
    senderPublicKey,
    recipientSecretKey
  );
  if (!decrypted) {
    throw new Error('Failed to decrypt message');
  }
  // Convert back to string
  return new TextDecoder().decode(decrypted);
}

// Helper function: Convert base64 string to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

// Helper function: Convert Uint8Array to base64 string
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
} 