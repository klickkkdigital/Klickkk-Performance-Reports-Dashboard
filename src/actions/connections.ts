'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/crypto'
import { requireAdmin } from '@/lib/auth'

// Shopify — manual token input (simpler than OAuth for admin-managed connections)
const shopifySchema = z.object({
  clientId: z.string(),
  storeDomain: z.string().regex(/^[a-z0-9-]+\.myshopify\.com$/),
  accessToken: z.string().min(10),
  accountName: z.string().min(1),
})

export async function addShopifyConnection(_prev: unknown, formData: FormData) {
  await requireAdmin()

  const parsed = shopifySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { clientId, storeDomain, accessToken, accountName } = parsed.data
  const encryptedToken = await encrypt(accessToken)

  await db.dataConnection.upsert({
    where: { clientId_platform_accountId: { clientId, platform: 'SHOPIFY', accountId: storeDomain } },
    create: { clientId, platform: 'SHOPIFY', accountId: storeDomain, accountName, accessToken: encryptedToken, isActive: true },
    update: { accessToken: encryptedToken, accountName, isActive: true },
  })

  revalidatePath(`/admin/connections`)
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
}

export async function removeConnection(connectionId: string) {
  await requireAdmin()
  await db.dataConnection.update({ where: { id: connectionId }, data: { isActive: false } })
  revalidatePath('/admin/connections')
}
