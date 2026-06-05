'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SessionPayload } from '@/lib/session'
import {
  LayoutDashboard,
  Megaphone,
  ShoppingBag,
  BarChart3,
  FileText,
  Settings,
  Users,
  Plug,
} from 'lucide-react'

type Client = { id: string; name: string; logoUrl: string | null; primaryColor: string; slug: string } | null

const clientNav = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/meta', label: 'Meta Ads', icon: Megaphone },
  { href: '/shopify', label: 'Shopify', icon: ShoppingBag },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: FileText },
]

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/connections', label: 'Connections', icon: Plug },
]

export default function Sidebar({
  session,
  client,
}: {
  session: SessionPayload
  client: Client
}) {
  const isAdmin = session.role === 'SUPER_ADMIN'
  const navItems = isAdmin ? adminNav : clientNav
  const brandColor = client?.primaryColor ?? '#0b0b0b'
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-default-200/80 bg-white/88 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="p-4">
        {client?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={client.logoUrl} alt={client.name} className="h-9 object-contain" />
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-default-200 bg-content1 px-3 py-3 shadow-sm">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              {isAdmin ? 'K' : client?.name[0] ?? 'K'}
            </div>
            <span className="min-w-0 text-sm font-semibold leading-tight text-foreground">
              {isAdmin ? 'Klickkk : Performance Reports' : (client?.name ?? 'Dashboard')}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname === href
                ? 'bg-[#0b0b0b] !text-white shadow-sm [&_svg]:!text-white'
                : 'text-default-600 hover:bg-default-100 hover:text-foreground'
            }`}
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-default-200/80 p-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-[#0b0b0b] !text-white [&_svg]:!text-white'
              : 'text-default-500 hover:bg-default-100 hover:text-foreground'
          }`}
        >
          <Settings size={17} />
          Settings
        </Link>
      </div>
    </aside>
  )
}
