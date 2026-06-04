import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDashboardRedirect, getDashboardUrl } from '@/lib/env'
import { exchangeGoogleCode, listGA4Properties } from '@/lib/google-analytics'
import { saveGoogleConnection } from '@/actions/connections'
import { createOAuthSelection } from '@/lib/oauth-selection'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.redirect(getDashboardRedirect('/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // clientId
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(getDashboardRedirect('/admin/connections?error=google_denied', req.url))
  }

  try {
    const redirectUri = `${getDashboardUrl(req.url)}/api/auth/google/callback`
    const tokens = await exchangeGoogleCode(code, redirectUri)
    if (!tokens.refresh_token) {
      return NextResponse.redirect(getDashboardRedirect(`/admin/clients/${state}?error=google_refresh_missing`, req.url))
    }

    const summaries = await listGA4Properties(tokens.access_token)

    const properties = summaries.accountSummaries?.flatMap(
      (a) => a.propertySummaries?.map((p) => ({ id: p.property.replace('properties/', ''), name: p.displayName })) ?? []
    ) ?? []

    if (properties.length === 0) {
      return NextResponse.redirect(getDashboardRedirect('/admin/connections?error=no_ga4_properties', req.url))
    }

    if (properties.length === 1) {
      await saveGoogleConnection(state, properties[0].id, properties[0].name, tokens.access_token, tokens.refresh_token)
      return NextResponse.redirect(getDashboardRedirect(`/admin/clients/${state}?success=google`, req.url))
    }

    const selectionId = await createOAuthSelection({
      platform: 'GOOGLE_ANALYTICS',
      clientId: state,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    })

    const encoded = Buffer.from(JSON.stringify({
      clientId: state,
      selectionId,
      properties,
    })).toString('base64url')

    return NextResponse.redirect(getDashboardRedirect(`/admin/connections/ga4-select?data=${encoded}`, req.url))
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(getDashboardRedirect(`/admin/clients/${state}?error=google_failed`, req.url))
  }
}
