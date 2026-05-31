'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/crypto'
import { requireAdmin } from '@/lib/auth'

function normalizeShopifyDomain(websiteUrl: string) {
  const value = websiteUrl.trim()
  const url = value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`

  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return value.toLowerCase().replace(/^www\./, '')
  }
}

// Shopify — manual app credential input for admin-managed connections
const shopifySchema = z.object({
  clientId: z.string(),
  websiteUrl: z.string().min(1, 'Website URL is required').transform(normalizeShopifyDomain),
  shopifyClientId: z.string().min(1, 'Client ID is required'),
  shopifySecretKey: z.string().min(1, 'Secret key is required'),
})

export async function addShopifyConnection(_prev: unknown, formData: FormData) {
  await requireAdmin()

  const parsed = shopifySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { clientId, websiteUrl, shopifyClientId, shopifySecretKey } = parsed.data
  const [encryptedSecretKey, encryptedClientId] = await Promise.all([
    encrypt(shopifySecretKey),
    encrypt(shopifyClientId),
  ])

  await db.dataConnection.upsert({
    where: { clientId_platform_accountId: { clientId, platform: 'SHOPIFY', accountId: websiteUrl } },
    create: {
      clientId,
      platform: 'SHOPIFY',
      accountId: websiteUrl,
      accountName: websiteUrl,
      accessToken: encryptedSecretKey,
      refreshToken: encryptedClientId,
      scopes: ['shopify_app_credentials'],
      isActive: true,
    },
    update: {
      accountName: websiteUrl,
      accessToken: encryptedSecretKey,
      refreshToken: encryptedClientId,
      scopes: ['shopify_app_credentials'],
      isActive: true,
    },
  })

  revalidatePath(`/admin/connections`)
  revalidatePath(`/admin/clients/${clientId}`)
  return { success: true }
}

// Meta — token comes from OAuth callback, stored here after exchange
export async function saveMetaConnection(
  clientId: string,
  adAccountId: string,
  adAccountName: string,
  accessToken: string,
  expiresAt: Date,
) {
  await requireAdmin()
  const encryptedToken = await encrypt(accessToken)
  await db.dataConnection.upsert({
    where: { clientId_platform_accountId: { clientId, platform: 'META', accountId: adAccountId } },
    create: { clientId, platform: 'META', accountId: adAccountId, accountName: adAccountName, accessToken: encryptedToken, tokenExpiresAt: expiresAt, isActive: true },
    update: { accessToken: encryptedToken, accountName: adAccountName, tokenExpiresAt: expiresAt, isActive: true },
  })
  revalidatePath('/admin/connections')
  revalidatePath(`/admin/clients/${clientId}`)
}

// Google Analytics — token comes from OAuth callback
export async function saveGoogleConnection(
  clientId: string,
  propertyId: string,
  propertyName: string,
  accessToken: string,
  refreshToken: string,
) {
  await requireAdmin()
  const [encAccess, encRefresh] = await Promise.all([encrypt(accessToken), encrypt(refreshToken)])
  await db.dataConnection.upsert({
    where: { clientId_platform_accountId: { clientId, platform: 'GOOGLE_ANALYTICS', accountId: propertyId } },
    create: { clientId, platform: 'GOOGLE_ANALYTICS', accountId: propertyId, accountName: propertyName, accessToken: encAccess, refreshToken: encRefresh, isActive: true, scopes: ['analytics.readonly'] },
    update: { accessToken: encAccess, refreshToken: encRefresh, accountName: propertyName, isActive: true },
  })
  revalidatePath('/admin/connections')
  revalidatePath(`/admin/clients/${clientId}`)
}

export async function removeConnection(connectionId: string) {
  await requireAdmin()
  const conn = await db.dataConnection.update({ where: { id: connectionId }, data: { isActive: false } })
  revalidatePath('/admin/connections')
  revalidatePath(`/admin/clients/${conn.clientId}`)
}
