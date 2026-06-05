'use client'
import { useActionState } from 'react'
import { createClient, CreateClientState } from '@/actions/clients'
import SectionHeader from '@/components/ui/SectionHeader'
import Link from 'next/link'
import { Alert } from '@heroui/react/alert'
import { Button, buttonVariants } from '@heroui/react/button'
import { Card } from '@heroui/react/card'
import { Input } from '@heroui/react/input'

export default function NewClientPage() {
  const [state, formAction, isPending] = useActionState<CreateClientState, FormData>(createClient, null)

  if (state?.success) {
    return (
      <div className="max-w-lg">
        <Alert status="success">
          <Alert.Content>
            <Alert.Title>Client created successfully!</Alert.Title>
            <Alert.Description>
              <Link href="/admin/clients" className="text-sm underline">Back to clients</Link>
            </Alert.Description>
          </Alert.Content>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <SectionHeader title="New Client" description="Create a client and their login credentials." />

      <Card>
        <form action={formAction} className="space-y-4 border border-default-200/80 bg-content1/95 p-6 shadow-sm">
        <h3 className="border-b border-default-100 pb-2 text-sm font-semibold text-foreground">Client Details</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-default-700">Company Name</label>
          <Input name="name" required fullWidth variant="primary" placeholder="Acme Corp" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-default-700">
            Slug <span className="font-normal text-default-400">(used in URL, e.g. acme-corp)</span>
          </label>
          <Input name="slug" required pattern="[a-z0-9-]+" fullWidth variant="primary" placeholder="acme-corp" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-default-700">Brand Color</label>
            <input name="primaryColor" type="color" defaultValue="#0b0b0b" className="h-10 w-full cursor-pointer rounded-md border border-default-300 bg-white p-1" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-default-700">Industry</label>
            <Input name="industry" fullWidth variant="primary" placeholder="E-commerce" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-default-700">Website URL</label>
          <Input name="websiteUrl" type="url" fullWidth variant="primary" placeholder="https://acme.com" />
        </div>

        <h3 className="border-b border-default-100 pb-2 pt-2 text-sm font-semibold text-foreground">Login Credentials</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-default-700">Client Name</label>
          <Input name="userName" required fullWidth variant="primary" placeholder="John Smith" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-default-700">Email</label>
          <Input name="userEmail" type="email" required fullWidth variant="primary" placeholder="john@acme.com" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-default-700">Password</label>
          <Input name="userPassword" type="password" required minLength={8} fullWidth variant="primary" placeholder="Min 8 characters" />
        </div>

        {state?.error && (
          <Alert status="danger">
            <Alert.Content><Alert.Title>{state.error}</Alert.Title></Alert.Content>
          </Alert>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            isDisabled={isPending}
            fullWidth
            variant="primary"
          >
            {isPending ? 'Creating…' : 'Create Client'}
          </Button>
          <Link href="/admin/clients" className={buttonVariants({ variant: 'outline', size: 'md' })}>
            Cancel
          </Link>
        </div>
      </form>
      </Card>
    </div>
  )
}
