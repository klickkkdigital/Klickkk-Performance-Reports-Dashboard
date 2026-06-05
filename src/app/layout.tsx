import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klickkk : Performance Reports",
  description: "Multi-platform reporting dashboard",
};

const crispWebsiteId =
  process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID ??
  "a6a2d3d1-a700-433f-af1e-0955da8a77d7";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="light h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Script
          id="crisp-live-chat"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.$crisp = window.$crisp || [];
              window.CRISP_WEBSITE_ID = ${JSON.stringify(crispWebsiteId)};
              window.__loadCrisp = function () {
                if (window.__crispLoaded) return;
                window.__crispLoaded = true;
                var d = document;
                var s = d.createElement("script");
                s.src = "https://client.crisp.chat/l.js";
                s.async = true;
                d.head.appendChild(s);
              };
              var startCrisp = function () {
                if ("requestIdleCallback" in window) {
                  window.requestIdleCallback(window.__loadCrisp, { timeout: 2000 });
                } else {
                  window.setTimeout(window.__loadCrisp, 1500);
                }
              };
              if (document.readyState === "complete") {
                startCrisp();
              } else {
                window.addEventListener("load", startCrisp, { once: true });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
