'use client'
import { removeConnection } from '@/actions/connections'
import { Button } from '@heroui/react/button'
import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'

export default function DisconnectButton({ connectionId }: { connectionId: string }) {
  const [pending, startTransition] = useTransition()

  const handleDisconnect = () => {
    if (!confirm('Disconnect this platform? Data already synced will remain.')) return
    startTransition(() => removeConnection(connectionId))
  }

  return (
    <Button
      onClick={handleDisconnect}
      isDisabled={pending}
      isIconOnly
      size="sm"
      variant="danger-soft"
      aria-label="Disconnect"
    >
      <Trash2 size={14} />
    </Button>
  )
}
