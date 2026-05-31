'use client'
import { removeConnection } from '@/actions/connections'
import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'

export default function DisconnectButton({ connectionId }: { connectionId: string }) {
  const [pending, startTransition] = useTransition()

  const handleDisconnect = () => {
    if (!confirm('Disconnect this platform? Data already synced will remain.')) return
    startTransition(() => removeConnection(connectionId))
  }

  return (
    <button
      onClick={handleDisconnect}
      disabled={pending}
      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      title="Disconnect"
    >
      <Trash2 size={14} />
    </button>
  )
}
