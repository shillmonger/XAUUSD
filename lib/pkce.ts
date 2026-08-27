import crypto from 'crypto';

/**
 * Generate a random string for PKCE code verifier
 * Uses the recommended method for generating code verifiers
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate code challenge from code verifier using SHA-256
 * As per PKCE specification (S256 method)
 */
export function generateCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return hash.toString('base64url');
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString('base64url');
}
