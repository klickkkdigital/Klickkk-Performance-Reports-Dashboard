import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()

  let client = null
  if (session.clientId) {
    client = await db.client.findUnique({
      where: { id: session.clientId },
      select: { id: true, name: true, logoUrl: true, primaryColor: true, slug: true },
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar session={session} client={client} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar session={session} client={client} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
