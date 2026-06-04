import 'server-only'
import { randomUUID } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { requireEnv } from './env'

const COOKIE_NAME = 'klickkk_oauth_selection'
const EXPIRY_SECONDS = 10 * 60

type OAuthSelectionPayload =
  | {
      platform: 'META'
      clientId: string
      accessToken: string
      expiresIn: number
    }
  | {
      platform: 'GOOGLE_ANALYTICS'
      clientId: string
      accessToken: string
      refreshToken: string
    }

type StoredOAuthSelection = OAuthSelectionPayload & {
  id: string
  kind: 'oauth_selection'
}

function getSecret() {
  return new TextEncoder().encode(requireEnv('SESSION_SECRET'))
}

export async function createOAuthSelection(payload: OAuthSelectionPayload) {
  const id = randomUUID()
  const token = await new SignJWT({ ...payload, id, kind: 'oauth_selection' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY_SECONDS}s`)
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRY_SECONDS,
    path: '/',
  })

  return id
}

export async function getOAuthSelection(
  id: string,
  platform: StoredOAuthSelection['platform'],
): Promise<StoredOAuthSelection | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    const selection = payload as unknown as StoredOAuthSelection
    if (selection.kind !== 'oauth_selection' || selection.id !== id || selection.platform !== platform) {
      return null
    }
    return selection
  } catch {
    return null
  }
}

export async function clearOAuthSelection() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
