'use client'
import { ShoppingBag } from 'lucide-react'

export default function AddShopifyForm({ clientId }: { clientId: string }) {
  return (
    <a
      href={`/api/auth/shopify/install?clientId=${encodeURIComponent(clientId)}`}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
    >
      <ShoppingBag size={13} />
      Install Shopify App
    </a>
  )
}
