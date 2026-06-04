import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDashboardRedirect, getDashboardUrl } from '@/lib/env'
import { exchangeCodeForToken, getLongLivedToken, fetchAdAccounts } from '@/lib/meta'
import { saveMetaConnection } from '@/actions/connections'
import { createOAuthSelection } from '@/lib/oauth-selection'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.redirect(getDashboardRedirect('/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // clientId passed via state param
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(getDashboardRedirect('/admin/connections?error=meta_denied', req.url))
  }

  try {
    const redirectUri = `${getDashboardUrl(req.url)}/api/auth/meta/callback`

    const shortToken = await exchangeCodeForToken(code, redirectUri)
    const longToken = await getLongLivedToken(shortToken.access_token)
    const accounts = await fetchAdAccounts(longToken.access_token)
    const activeAccounts = accounts.filter((a) => a.account_status === 1)

    if (activeAccounts.length === 0) {
      return NextResponse.redirect(getDashboardRedirect('/admin/connections?error=no_ad_accounts', req.url))
    }

    if (activeAccounts.length === 1) {
      const acct = activeAccounts[0]
      const expiresAt = new Date(Date.now() + longToken.expires_in * 1000)
      await saveMetaConnection(state, acct.id, acct.name, longToken.access_token, expiresAt)
      return NextResponse.redirect(getDashboardRedirect(`/admin/clients/${state}?success=meta`, req.url))
    }

    const selectionId = await createOAuthSelection({
      platform: 'META',
      clientId: state,
      accessToken: longToken.access_token,
      expiresIn: longToken.expires_in,
    })

    const encoded = Buffer.from(JSON.stringify({
      clientId: state,
      selectionId,
      accounts: activeAccounts,
    })).toString('base64url')

    return NextResponse.redirect(getDashboardRedirect(`/admin/connections/meta-select?data=${encoded}`, req.url))
  } catch (err) {
    console.error('Meta OAuth callback error:', err)
    return NextResponse.redirect(getDashboardRedirect(`/admin/clients/${state}?error=meta_failed`, req.url))
  }
}
