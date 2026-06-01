export function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function getBaseUrl(requestUrl?: string) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  if (requestUrl) return new URL(requestUrl).origin
  return 'http://localhost:3000'
}

export function getDashboardUrl(requestUrl?: string) {
  if (process.env.NEXT_PUBLIC_DASHBOARD_URL) return process.env.NEXT_PUBLIC_DASHBOARD_URL.replace(/\/$/, '')
  if (requestUrl) return new URL(requestUrl).origin
  return 'http://localhost:3000'
}

export function getDashboardRedirect(path: string, requestUrl?: string) {
  return new URL(path, getDashboardUrl(requestUrl))
}
