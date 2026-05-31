'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { requireAdmin } from '@/lib/auth'

const createClientSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  // Initial user credentials
  userEmail: z.string().email(),
  userName: z.string().min(2),
  userPassword: z.string().min(8),
})

export type CreateClientState = { error?: string; success?: boolean } | null

export async function createClient(_prev: CreateClientState, formData: FormData): Promise<CreateClientState> {
  await requireAdmin()

  const parsed = createClientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, slug, primaryColor, websiteUrl, industry, userEmail, userName, userPassword } = parsed.data

  const existing = await db.client.findUnique({ where: { slug } })
  if (existing) return { error: 'A client with this slug already exists.' }

  const passwordHash = await hashPassword(userPassword)

  await db.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: { name, slug, primaryColor, websiteUrl: websiteUrl || null, industry: industry || null },
    })
    await tx.user.create({
      data: { clientId: client.id, email: userEmail, name: userName, passwordHash, role: 'CLIENT_VIEWER' },
    })
  })

  revalidatePath('/admin/clients')
  return { success: true }
}

export async function toggleClientStatus(clientId: string) {
  await requireAdmin()
  const client = await db.client.findUniqueOrThrow({ where: { id: clientId } })
  await db.client.update({ where: { id: clientId }, data: { isActive: !client.isActive } })
  revalidatePath('/admin/clients')
}

export async function updateClientBranding(
  clientId: string,
  data: { logoUrl?: string; primaryColor?: string; name?: string },
) {
  await requireAdmin()
  await db.client.update({ where: { id: clientId }, data })
  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${clientId}`)
}
