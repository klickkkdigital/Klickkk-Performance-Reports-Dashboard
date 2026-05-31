import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { exchangeCodeForToken, getLongLivedToken, fetchAdAccounts } from '@/lib/meta'
import { saveMetaConnection } from '@/actions/connections'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // clientId passed via state param
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(new URL(`/admin/connections?error=meta_denied`, req.url))
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

    const shortToken = await exchangeCodeForToken(code, redirectUri)
    const longToken = await getLongLivedToken(shortToken.access_token)
    const accounts = await fetchAdAccounts(longToken.access_token)
    const activeAccounts = accounts.filter((a) => a.account_status === 1)

    if (activeAccounts.length === 0) {
      return NextResponse.redirect(new URL('/admin/connections?error=no_ad_accounts', req.url))
    }

    // If one account, save it. If multiple, redirect to selection page.
    if (activeAccounts.length === 1) {
      const acct = activeAccounts[0]
      const expiresAt = new Date(Date.now() + longToken.expires_in * 1000)
      await saveMetaConnection(state, acct.id, acct.name, longToken.access_token, expiresAt)
      return NextResponse.redirect(new URL('/admin/connections?success=meta', req.url))
    }

    // Multiple accounts — encode and redirect to selection page
    const encoded = Buffer.from(JSON.stringify({
      clientId: state,
      token: longToken.access_token,
      expiresIn: longToken.expires_in,
      accounts: activeAccounts,
    })).toString('base64url')

    return NextResponse.redirect(new URL(`/admin/connections/meta-select?data=${encoded}`, req.url))
  } catch (err) {
    console.error('Meta OAuth callback error:', err)
    return NextResponse.redirect(new URL('/admin/connections?error=meta_failed', req.url))
  }
}
