import { requireAdmin } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar session={session} client={null} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar session={session} client={null} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
