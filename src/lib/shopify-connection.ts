import { db } from './db'
import { encrypt } from './crypto'

export async function saveShopifyConnectionRecord(
  clientId: string,
  shop: string,
  accessToken: string,
  scopes: string[],
  shopName?: string,
  refreshToken?: string,
  expiresIn?: number,
) {
  const encryptedToken = await encrypt(accessToken)
  const encryptedRefreshToken = refreshToken ? await encrypt(refreshToken) : null
  const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

  await db.dataConnection.upsert({
    where: { clientId_platform_accountId: { clientId, platform: 'SHOPIFY', accountId: shop } },
    create: {
      clientId,
      platform: 'SHOPIFY',
      accountId: shop,
      accountName: shopName || shop,
      accessToken: encryptedToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt,
      scopes,
      isActive: true,
    },
    update: {
      accountName: shopName || shop,
      accessToken: encryptedToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt,
      scopes,
      isActive: true,
    },
  })
}
