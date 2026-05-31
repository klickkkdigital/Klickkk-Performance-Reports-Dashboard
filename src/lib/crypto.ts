// AES-256-GCM encryption for OAuth tokens stored in the database

const algorithm = 'AES-GCM'
const keyLength = 256

function getKey(): Promise<CryptoKey> {
  const raw = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  return crypto.subtle.importKey('raw', raw, { name: algorithm }, false, ['encrypt', 'decrypt'])
}

export async function encrypt(text: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(text)
  const ciphertext = await crypto.subtle.encrypt({ name: algorithm, iv }, key, encoded)
  const buf = Buffer.concat([Buffer.from(iv), Buffer.from(ciphertext)])
  return buf.toString('base64')
}

export async function decrypt(data: string): Promise<string> {
  const key = await getKey()
  const buf = Buffer.from(data, 'base64')
  const iv = buf.subarray(0, 12)
  const ciphertext = buf.subarray(12)
  const plaintext = await crypto.subtle.decrypt({ name: algorithm, iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

// Generate a 32-byte hex key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
export { keyLength }
