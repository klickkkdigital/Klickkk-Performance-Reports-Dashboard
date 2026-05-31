import { SessionPayload } from '@/lib/session'
import { logout } from '@/actions/auth'
import { LogOut } from 'lucide-react'

type Client = { name: string } | null

export default function TopBar({ session, client }: { session: SessionPayload; client: Client }) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-sm text-gray-500">
        {session.role === 'SUPER_ADMIN' ? 'Admin Portal' : `${client?.name ?? ''} Dashboard`}
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </form>
    </header>
  )
}
