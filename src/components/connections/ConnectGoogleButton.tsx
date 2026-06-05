import { getDashboardUrl } from '@/lib/env'
import { buttonVariants } from '@heroui/react/button'
import { BarChart3 } from 'lucide-react'

export default function ConnectGoogleButton({ clientId }: { clientId: string }) {
  const clientIdValue = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly'].join(' ')

  if (!clientIdValue) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-default-100 px-3 py-1.5 text-xs text-default-400">
        <BarChart3 size={14} />
        Connect GA4
      </span>
    )
  }

  const redirectUri = `${getDashboardUrl()}/api/auth/google/callback`
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientIdValue)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('state', clientId)

  return (
    <a
      href={url.toString()}
      className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5 bg-[#0b0b0b] text-white hover:bg-[#2a2a2a]' })}
    >
      <BarChart3 size={14} />
      Connect GA4
    </a>
  )
}
