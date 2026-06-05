import { requireAdmin } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()

  return (
    <div className="dashboard-shell flex h-screen">
      <Sidebar session={session} client={null} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar session={session} client={null} />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
