import type { Metadata } from 'next'
import Providers from '@/components/providers'
import '../index.css'

export const metadata: Metadata = {
  title: 'NestJS + Next.js Monorepo',
  description:
    'Fullstack monorepo powered by Turborepo, NestJS v12, Next.js 16, Drizzle, and Better Auth',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
              <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                    M
                  </div>
                  <span className="font-semibold tracking-tight text-zinc-100">
                    Turborepo <span className="text-indigo-400">Fullstack</span>
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    API: localhost:3001
                  </span>
                  <a
                    href="http://localhost:3001/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                  >
                    Scalar Docs ↗
                  </a>
                </div>
              </div>
            </header>
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
