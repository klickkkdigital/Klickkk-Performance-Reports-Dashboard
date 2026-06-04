import 'server-only'
import { db } from './db'
import { decrypt, encrypt } from './crypto'
import { fetchAdAccountCampaigns, fetchCampaignInsights, mapObjectiveToCampaignType, parseActionValue } from './meta'
import { fetchShopifyOrdersForRange, fetchTopProducts } from './shopify'
import { getShopifyApiKey, getShopifyApiSecret } from './shopify-auth'
import { fetchGA4Report, refreshGoogleToken, normalizeChannel } from './google-analytics'
import { format, eachDayOfInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { Platform } from '@prisma/client'

export async function syncClientData(clientId: string, month: string) {
  const connections = await db.dataConnection.findMany({
    where: { clientId, isActive: true },
  })

  const [year, mon] = month.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, mon - 1))
  const monthEnd = endOfMonth(monthStart)
  const dateStart = format(monthStart, 'yyyy-MM-dd')
  const dateEnd = format(monthEnd, 'yyyy-MM-dd')

  await Promise.allSettled(
    connections.map((conn) => syncConnection(conn, dateStart, dateEnd)),
  )
}

export async function syncDataConnection(connectionId: string, month: string) {
  const conn = await db.dataConnection.findUnique({
    where: { id: connectionId },
  })

  if (!conn || !conn.isActive) return

  const [year, mon] = month.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, mon - 1))
  const monthEnd = endOfMonth(monthStart)
  const dateStart = format(monthStart, 'yyyy-MM-dd')
  const dateEnd = format(monthEnd, 'yyyy-MM-dd')

  await syncConnection(conn, dateStart, dateEnd)
}

async function syncConnection(
  conn: {
    id: string
    clientId: string
    platform: Platform
    accountId: string
    accessToken: string
    refreshToken: string | null
    tokenExpiresAt: Date | null
    scopes: string[]
  },
  dateStart: string,
  dateEnd: string,
) {
  await db.dataConnection.update({ where: { id: conn.id }, data: { lastSyncStatus: 'SYNCING' } })

  try {
    const token = await decrypt(conn.accessToken)

    if (conn.platform === 'META') await syncMeta(conn.clientId, conn.accountId, token, dateStart, dateEnd)
    if (conn.platform === 'SHOPIFY') {
      const shopifyToken = await ensureShopifyToken(conn, token)
      await syncShopify(conn.clientId, conn.accountId, shopifyToken, dateStart, dateEnd)
    }
    if (conn.platform === 'GOOGLE_ANALYTICS') {
      const refreshToken = conn.refreshToken ? await decrypt(conn.refreshToken) : null
      await syncGA4(conn.clientId, conn.accountId, token, refreshToken, conn.id, dateStart, dateEnd)
    }

    await db.dataConnection.update({
      where: { id: conn.id },
      data: { lastSyncStatus: 'SUCCESS', lastSyncedAt: new Date(), lastSyncError: null },
    })
  } catch (err) {
    await db.dataConnection.update({
      where: { id: conn.id },
      data: { lastSyncStatus: 'FAILED', lastSyncError: String(err) },
    })
    throw err
  }
}

type ShopifyTokenResponse = {
  access_token: string
  scope?: string
  expires_in?: number
  refresh_token?: string
  refresh_token_expires_in?: number
}

function tokenExpiresAt(expiresIn?: number) {
  return expiresIn ? new Date(Date.now() + expiresIn * 1000) : null
}

function shouldRefresh(expiresAt: Date | null) {
  if (!expiresAt) return false
  return expiresAt.getTime() <= Date.now() + 5 * 60 * 1000
}

async function postShopifyTokenRequest(shop: string, body: Record<string, string | number>) {
  const form = new URLSearchParams()
  for (const [key, value] of Object.entries(body)) form.set(key, String(value))

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: form,
  })

  if (!res.ok) {
    throw new Error(`Shopify token refresh failed (${res.status}): ${(await res.text()).slice(0, 300)}`)
  }

  return res.json() as Promise<ShopifyTokenResponse>
}

async function persistShopifyToken(
  connectionId: string,
  token: ShopifyTokenResponse,
  fallbackScopes: string[],
) {
  const scopes = token.scope?.split(',').map((scope) => scope.trim()).filter(Boolean) || fallbackScopes
  const encryptedRefreshToken = token.refresh_token ? await encrypt(token.refresh_token) : undefined

  await db.dataConnection.update({
    where: { id: connectionId },
    data: {
      accessToken: await encrypt(token.access_token),
      ...(encryptedRefreshToken ? { refreshToken: encryptedRefreshToken } : {}),
      scopes,
      tokenExpiresAt: tokenExpiresAt(token.expires_in),
      lastSyncError: null,
    },
  })

  return token.access_token
}

async function ensureShopifyToken(
  conn: {
    id: string
    accountId: string
    accessToken: string
    refreshToken: string | null
    tokenExpiresAt: Date | null
    scopes: string[]
  },
  decryptedAccessToken: string,
) {
  if (conn.refreshToken && shouldRefresh(conn.tokenExpiresAt)) {
    const token = await postShopifyTokenRequest(conn.accountId, {
      client_id: getShopifyApiKey(),
      client_secret: getShopifyApiSecret(),
      grant_type: 'refresh_token',
      refresh_token: await decrypt(conn.refreshToken),
    })
    return persistShopifyToken(conn.id, token, conn.scopes)
  }

  if (!conn.refreshToken || !conn.tokenExpiresAt) {
    const token = await postShopifyTokenRequest(conn.accountId, {
      client_id: getShopifyApiKey(),
      client_secret: getShopifyApiSecret(),
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: decryptedAccessToken,
      subject_token_type: 'urn:shopify:params:oauth:token-type:offline-access-token',
      requested_token_type: 'urn:shopify:params:oauth:token-type:offline-access-token',
      expiring: 1,
    })
    return persistShopifyToken(conn.id, token, conn.scopes)
  }

  return decryptedAccessToken
}

async function syncMeta(clientId: string, adAccountId: string, token: string, dateStart: string, dateEnd: string) {
  const campaigns = await fetchAdAccountCampaigns(token, adAccountId)

  for (const campaign of campaigns) {
    const type = mapObjectiveToCampaignType(campaign.objective)

    const saved = await db.campaign.upsert({
      where: { clientId_platform_externalId: { clientId, platform: 'META', externalId: campaign.id } },
      create: { clientId, platform: 'META', externalId: campaign.id, name: campaign.name, type, status: campaign.status },
      update: { name: campaign.name, status: campaign.status },
    })

    const insights = await fetchCampaignInsights(token, campaign.id, type, dateStart, dateEnd)

    for (const day of insights) {
      const date = parseISO(day.date_start)
      const purchases = parseActionValue(day.actions, 'purchase')
      const purchaseValue = parseActionValue(day.action_values, 'purchase')
      const addToCart = parseActionValue(day.actions, 'add_to_cart')
      const checkouts = parseActionValue(day.actions, 'initiate_checkout')
      const roasArr = day.purchase_roas ?? []
      const roas = parseFloat(roasArr[0]?.value ?? '0')
      const spend = parseFloat(day.spend ?? '0')

      await db.campaignMetric.upsert({
        where: { campaignId_date: { campaignId: saved.id, date } },
        create: {
          campaignId: saved.id,
          date,
          spend,
          impressions: parseInt(day.impressions ?? '0'),
          reach: parseInt(day.reach ?? '0'),
          frequency: parseFloat(day.frequency ?? '0'),
          cpm: parseFloat(day.cpm ?? '0'),
          clicks: parseInt(day.clicks ?? '0'),
          ctr: parseFloat(day.ctr ?? '0'),
          cpc: parseFloat(day.cpc ?? '0'),
          landingPageViews: parseInt(day.landing_page_views ?? '0'),
          purchases,
          purchaseValue,
          roas,
          addToCart,
          checkoutsInitiated: checkouts,
          cpa: purchases > 0 ? spend / purchases : 0,
        },
        update: {
          spend,
          impressions: parseInt(day.impressions ?? '0'),
          reach: parseInt(day.reach ?? '0'),
          frequency: parseFloat(day.frequency ?? '0'),
          cpm: parseFloat(day.cpm ?? '0'),
          clicks: parseInt(day.clicks ?? '0'),
          ctr: parseFloat(day.ctr ?? '0'),
          cpc: parseFloat(day.cpc ?? '0'),
          landingPageViews: parseInt(day.landing_page_views ?? '0'),
          purchases,
          purchaseValue,
          roas,
          addToCart,
          checkoutsInitiated: checkouts,
          cpa: purchases > 0 ? spend / purchases : 0,
        },
      })
    }
  }
}

async function syncShopify(clientId: string, storeDomain: string, token: string, dateStart: string, dateEnd: string) {
  const orders = await fetchShopifyOrdersForRange(storeDomain, token, dateStart, dateEnd)

  // Group by day
  const byDay = new Map<string, { revenue: number; orders: number; new: number; returning: number; refunds: number }>()
  for (const order of orders) {
    const day = format(parseISO(order.created_at), 'yyyy-MM-dd')
    const current = byDay.get(day) ?? { revenue: 0, orders: 0, new: 0, returning: 0, refunds: 0 }
    current.revenue += parseFloat(order.total_price)
    current.orders += 1
    if (order.customer?.orders_count === 1) current.new += 1
    else current.returning += 1
    if (order.refunds?.length) current.refunds += parseFloat(order.total_price)
    byDay.set(day, current)
  }

  for (const [day, data] of byDay.entries()) {
    const date = parseISO(day)
    const aov = data.orders > 0 ? data.revenue / data.orders : 0
    await db.shopifyMetric.upsert({
      where: { clientId_date: { clientId, date } },
      create: { clientId, date, totalRevenue: data.revenue, totalOrders: data.orders, avgOrderValue: aov, newCustomers: data.new, returningCustomers: data.returning, refunds: data.refunds },
      update: { totalRevenue: data.revenue, totalOrders: data.orders, avgOrderValue: aov, newCustomers: data.new, returningCustomers: data.returning, refunds: data.refunds },
    })
  }

  // Top products
  const products = await fetchTopProducts(storeDomain, token, dateStart, dateEnd)
  const month = dateStart.slice(0, 7)
  for (const p of products) {
    await db.topProduct.upsert({
      where: { clientId_month_productId: { clientId, month, productId: p.productId } },
      create: { clientId, month, ...p },
      update: { revenue: p.revenue, unitsSold: p.unitsSold, rank: p.rank },
    })
  }
}

async function syncGA4(
  clientId: string,
  propertyId: string,
  accessToken: string,
  refreshToken: string | null,
  connectionId: string,
  dateStart: string,
  dateEnd: string,
) {
  let token = accessToken

  // Try to refresh if we have a refresh token
  if (refreshToken) {
    try {
      const refreshed = await refreshGoogleToken(refreshToken)
      token = refreshed.access_token
      // Persist the new token
      const { encrypt } = await import('./crypto')
      await db.dataConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: await encrypt(refreshed.access_token),
          tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      })
    } catch {
      // Use existing token if refresh fails
    }
  }

  const report = await fetchGA4Report(token, propertyId, dateStart, dateEnd)

  const byDay = new Map<string, Record<string, number>>()

  for (const row of report.rows ?? []) {
    const date = row.dimensionValues[0].value // YYYYMMDD
    const channel = row.dimensionValues[1].value
    const normalizedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
    const channelKey = normalizeChannel(channel)

    const current = byDay.get(normalizedDate) ?? {
      sessions: 0, users: 0, newUsers: 0, pageviews: 0,
      bounceRate: 0, avgSessionDuration: 0, bounceRateCount: 0,
      organicSearch: 0, paidSearch: 0, social: 0, direct: 0, referral: 0, email: 0,
    }

    const [sessions, users, newUsers, pageviews, bounceRate, avgDuration] =
      row.metricValues.map((m) => parseFloat(m.value))

    current.sessions += sessions
    current.users += users
    current.newUsers += newUsers
    current.pageviews += pageviews
    current.bounceRate += bounceRate
    current.bounceRateCount += 1
    current.avgSessionDuration += avgDuration
    ;(current as Record<string, number>)[channelKey] =
      ((current as Record<string, number>)[channelKey] ?? 0) + sessions

    byDay.set(normalizedDate, current)
  }

  for (const [day, data] of byDay.entries()) {
    const date = parseISO(day)
    const avgBounce = data.bounceRateCount > 0 ? data.bounceRate / data.bounceRateCount : 0
    const avgDur = data.sessions > 0 ? data.avgSessionDuration / data.sessions : 0

    await db.analyticsMetric.upsert({
      where: { clientId_date: { clientId, date } },
      create: {
        clientId, date,
        sessions: data.sessions, users: data.users, newUsers: data.newUsers,
        pageviews: data.pageviews, bounceRate: avgBounce, avgSessionDuration: avgDur,
        organicSearch: data.organicSearch, paidSearch: data.paidSearch, social: data.social,
        direct: data.direct, referral: data.referral, email: data.email,
      },
      update: {
        sessions: data.sessions, users: data.users, newUsers: data.newUsers,
        pageviews: data.pageviews, bounceRate: avgBounce, avgSessionDuration: avgDur,
        organicSearch: data.organicSearch, paidSearch: data.paidSearch, social: data.social,
        direct: data.direct, referral: data.referral, email: data.email,
      },
    })
  }
}
