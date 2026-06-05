'use client'
import { useActionState } from 'react'
import { login, LoginState } from '@/actions/auth'
import { Alert } from '@heroui/react/alert'
import { Button } from '@heroui/react/button'
import { Card } from '@heroui/react/card'
import { Input } from '@heroui/react/input'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(login, null)

  return (
    <div className="dashboard-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Card className="border border-default-200/80 bg-content1/95 p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#0b0b0b] shadow-sm">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
            <p className="mt-1 text-sm text-default-500">Access your reporting dashboard</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                fullWidth
                variant="primary"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                fullWidth
                variant="primary"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <Alert status="danger">
                <Alert.Content><Alert.Title>{state.error}</Alert.Title></Alert.Content>
              </Alert>
            )}

            <Button
              type="submit"
              isDisabled={isPending}
              fullWidth
              variant="primary"
            >
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-xs text-default-400">Klickkk : Performance Reports</p>
      </div>
    </div>
  )
}
