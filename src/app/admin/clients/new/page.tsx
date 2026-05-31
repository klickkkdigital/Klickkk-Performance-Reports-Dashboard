'use client'
import { useActionState } from 'react'
import { createClient, CreateClientState } from '@/actions/clients'
import SectionHeader from '@/components/ui/SectionHeader'
import Link from 'next/link'

export default function NewClientPage() {
  const [state, formAction, isPending] = useActionState<CreateClientState, FormData>(createClient, null)

  if (state?.success) {
    return (
      <div className="max-w-lg">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
          <p className="text-emerald-700 font-medium mb-3">Client created successfully!</p>
          <Link href="/admin/clients" className="text-sm text-emerald-600 underline">Back to clients</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <SectionHeader title="New Client" description="Create a client and their login credentials." />

      <form action={formAction} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">Client Details</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input name="name" required className="input" placeholder="Acme Corp" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug <span className="text-gray-400 font-normal">(used in URL, e.g. acme-corp)</span>
          </label>
          <input name="slug" required pattern="[a-z0-9-]+" className="input" placeholder="acme-corp" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
            <input name="primaryColor" type="color" defaultValue="#6366f1" className="h-10 w-full rounded-lg border border-gray-300 p-1 cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <input name="industry" className="input" placeholder="E-commerce" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
          <input name="websiteUrl" type="url" className="input" placeholder="https://acme.com" />
        </div>

        <h3 className="text-sm font-semibold text-gray-700 pt-2 pb-2 border-b border-gray-100">Login Credentials</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
          <input name="userName" required className="input" placeholder="John Smith" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input name="userEmail" type="email" required className="input" placeholder="john@acme.com" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input name="userPassword" type="password" required minLength={8} className="input" placeholder="Min 8 characters" />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Creating…' : 'Create Client'}
          </button>
          <Link href="/admin/clients" className="px-4 py-2.5 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; outline: none; } .input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }`}</style>
    </div>
  )
}
