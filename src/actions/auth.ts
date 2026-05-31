'use server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { verifyCredentials } from '@/lib/auth'
import { createSession, deleteSession } from '@/lib/session'
import { db } from '@/lib/db'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type LoginState = { error?: string } | null

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) return { error: 'Invalid email or password.' }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password)
  if (!user) return { error: 'Invalid email or password.' }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  await createSession({
    userId: user.id,
    role: user.role,
    clientId: user.clientId ?? null,
    clientSlug: user.client?.slug ?? null,
  })

  redirect(user.role === 'SUPER_ADMIN' ? '/admin' : '/overview')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
