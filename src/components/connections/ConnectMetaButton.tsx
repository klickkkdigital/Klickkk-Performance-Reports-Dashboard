import { getDashboardUrl } from '@/lib/env'
import { buttonVariants } from '@heroui/react/button'
import { Megaphone } from 'lucide-react'

export default function ConnectMetaButton({ clientId }: { clientId: string }) {
  const META_SCOPES = 'ads_read,ads_management,business_management'
  const clientAppId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID

  if (!clientAppId) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-default-100 px-3 py-1.5 text-xs text-default-400">
        <Megaphone size={14} />
        Connect Meta
      </span>
    )
  }

  const redirectUri = `${getDashboardUrl()}/api/auth/meta/callback`
  const url = new URL('https://www.facebook.com/v20.0/dialog/oauth')
  url.searchParams.set('client_id', clientAppId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', META_SCOPES)
  url.searchParams.set('state', clientId)
  url.searchParams.set('response_type', 'code')

  return (
    <a
      href={url.toString()}
      className={buttonVariants({ variant: 'primary', size: 'sm', className: 'gap-1.5 bg-[#0b0b0b] text-white hover:bg-[#2a2a2a]' })}
    >
      <Megaphone size={14} />
      Connect Meta
    </a>
  )
}
