const GA4_API = 'https://analyticsdata.googleapis.com/v1beta'
const OAUTH_API = 'https://oauth2.googleapis.com'

export async function fetchGA4Report(
  accessToken: string,
  propertyId: string,
  dateStart: string,
  dateEnd: string,
) {
  const res = await fetch(`${GA4_API}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: dateStart, endDate: dateEnd }],
      dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGrouping' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
    }),
  })
  if (!res.ok) throw new Error(`GA4 report failed: ${res.status}`)
  return res.json() as Promise<GA4ReportResponse>
}

export async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch(`${OAUTH_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Google token refresh failed')
  return res.json() as Promise<{ access_token: string; expires_in: number }>
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const res = await fetch(`${OAUTH_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error('Google code exchange failed')
  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    scope: string
  }>
}

export async function listGA4Properties(accessToken: string) {
  const res = await fetch(
    'https://analyticsadmin.googleapis.com/v1alpha/accountSummaries',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) throw new Error('GA4 property list failed')
  const data = await res.json()
  return data as GA4AccountSummaries
}

const CHANNEL_MAP: Record<string, string> = {
  'Organic Search': 'organicSearch',
  'Paid Search': 'paidSearch',
  Social: 'social',
  Direct: 'direct',
  Referral: 'referral',
  Email: 'email',
}

export function normalizeChannel(channel: string): string {
  return CHANNEL_MAP[channel] ?? 'referral'
}

export type GA4ReportResponse = {
  rows?: Array<{
    dimensionValues: Array<{ value: string }>
    metricValues: Array<{ value: string }>
  }>
}

export type GA4AccountSummaries = {
  accountSummaries?: Array<{
    account: string
    displayName: string
    propertySummaries?: Array<{
      property: string
      displayName: string
    }>
  }>
}
