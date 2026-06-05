import { SessionPayload } from '@/lib/session'
import { logout } from '@/actions/auth'
import { Avatar } from '@heroui/react/avatar'
import { Button } from '@heroui/react/button'
import { LogOut, PanelLeft } from 'lucide-react'

type Client = { name: string } | null

export default function TopBar({ session, client }: { session: SessionPayload; client: Client }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-default-200/80 bg-white/82 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button isIconOnly variant="ghost" size="sm" className="lg:hidden" aria-label="Open navigation">
          <PanelLeft size={18} />
        </Button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-default-400">
            {session.role === 'SUPER_ADMIN' ? 'Admin Portal' : 'Client Workspace'}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {session.role === 'SUPER_ADMIN' ? 'Klickkk Operations' : `${client?.name ?? ''} Dashboard`}
          </p>
        </div>
      </div>
      <form action={logout}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Avatar className="h-5 w-5 text-[10px]">
            <Avatar.Fallback>{session.role === 'SUPER_ADMIN' ? 'A' : 'U'}</Avatar.Fallback>
          </Avatar>
          <span className="hidden sm:inline">Sign out</span>
          <LogOut size={14} />
        </Button>
      </form>
    </header>
  )
}
