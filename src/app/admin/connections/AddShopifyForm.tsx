'use client'
import { useActionState, useState } from 'react'
import { ShoppingBag, Loader2, X } from 'lucide-react'
import { startShopifyInstall } from '@/actions/connections'

export default function AddShopifyForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(startShopifyInstall, null)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <ShoppingBag size={13} />
        Connect Shopify
      </button>
    )
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="flex flex-col gap-0.5">
        <input
          name="shop"
          type="text"
          placeholder="mystore.myshopify.com"
          autoFocus
          required
          disabled={pending}
          className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
        />
        {state?.error && (
          <span className="text-xs text-red-500">{state.error}</span>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {pending ? <Loader2 size={13} className="animate-spin" /> : <ShoppingBag size={13} />}
        {pending ? 'Connecting…' : 'Connect'}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        disabled={pending}
        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
        aria-label="Cancel"
      >
        <X size={14} />
      </button>
    </form>
  )
}
