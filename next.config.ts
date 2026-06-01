import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const appHost = 'reporting.klickkk.app'
    const dashboardUrl = 'https://reporting.klickkk.com'
    const appHostCondition = [{ type: 'host' as const, value: appHost }]

    return [
      {
        source: '/',
        has: appHostCondition,
        destination: dashboardUrl,
        permanent: false,
      },
      {
        source: '/:path((?!api(?:/|$)|_next(?:/|$)|favicon.ico$|robots.txt$|sitemap.xml$).*)',
        has: appHostCondition,
        destination: `${dashboardUrl}/:path`,
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
