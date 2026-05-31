import { requireSession } from '@/lib/auth'
import SectionHeader from '@/components/ui/SectionHeader'

export default async function SettingsPage() {
  const session = await requireSession()

  return (
    <div>
      <SectionHeader title="Settings" description="Account and preferences" />
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Role</p>
            <p className="text-sm text-gray-900 capitalize">{session.role.replace('_', ' ').toLowerCase()}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Account</p>
            <p className="text-sm text-gray-900">{session.clientSlug ?? 'Admin'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
