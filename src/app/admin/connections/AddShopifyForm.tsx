'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { addShopifyConnection } from '@/actions/connections'
import { X } from 'lucide-react'

export default function AddShopifyForm({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<{ error?: string; success?: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addShopifyConnection(null, formData)
      setState(result)

      if (result?.success) {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Connect Shopify
      </button>

      {open && (
        <div className="fixed inset-0 bg-gray-950/40 flex items-center justify-center z-50 px-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-lg p-5 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <h3 className="text-base font-semibold text-gray-900">Connect Shopify Store</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <input type="hidden" name="clientId" value={clientId} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input
                  name="websiteUrl"
                  required
                  placeholder="mystore.myshopify.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                <input
                  name="shopifyClientId"
                  required
                  autoComplete="off"
                  placeholder="Shopify app client ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input
                  name="shopifySecretKey"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Shopify app secret key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
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
