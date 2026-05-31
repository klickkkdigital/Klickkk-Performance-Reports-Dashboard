'use client'
import { useState, useActionState } from 'react'
import { addShopifyConnection } from '@/actions/connections'

export default function AddShopifyForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(addShopifyConnection, null)

  if (state?.success && open) setOpen(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        + Shopify
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Connect Shopify Store</h3>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="clientId" value={clientId} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Domain</label>
                <input name="storeDomain" required placeholder="mystore.myshopify.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input name="accountName" required placeholder="My Shopify Store" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin API Token</label>
                <input name="accessToken" type="password" required placeholder="shpat_..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <p className="text-xs text-gray-400 mt-1">From Shopify Admin → Settings → Apps → Develop apps</p>
              </div>

              {state?.error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                  {isPending ? 'Connecting…' : 'Connect'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
