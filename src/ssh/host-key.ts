import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { generateKeyPairSync } from 'node:crypto';

/**
 * Load the SSH host private key from disk, generating one on first run.
 *
 * ssh2 parses PEM-encoded keys: RSA (PKCS#1), DSA, ECDSA, and OpenSSH-format
 * ed25519. Node's `generateKeyPairSync` emits PKCS#8 PEM by default, which
 * ssh2 rejects for ed25519. RSA-3072/PKCS#1 is universally accepted and is
 * the most robust choice for a dev-fallback key generator — production
 * should use `ssh-keygen -t ed25519 -f host_rsa` (OpenSSH format), which
 * the provisioner does.
 */
export function loadOrCreateHostKey(keyPath: string): Buffer {
  if (existsSync(keyPath)) {
    return readFileSync(keyPath);
  }
  const dir = path.dirname(keyPath);
  if (dir && dir !== '.' && dir !== '') {
    mkdirSync(dir, { recursive: true });
  }
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 3072,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
  writeFileSync(keyPath, privateKey, { mode: 0o600 });
  try {
    chmodSync(keyPath, 0o600);
  } catch {
    // Windows dev: chmod is a no-op; the file is owned by the current user.
  }
  return Buffer.from(privateKey);
}
