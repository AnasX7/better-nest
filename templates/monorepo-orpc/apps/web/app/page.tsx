import { Button } from '@repo/ui/components/button'
import { api } from '@/lib/api-client'
import { TechStackVisual } from '@/components/tech-stack-visual'
import { GalleryVerticalEnd } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function checkApiConnection(): Promise<boolean> {
  try {
    const res = await api.hello.get()
    return !!res.message
  } catch (error) {
    console.error('Error connecting to API:', error)
    return false
  }
}

export default async function Home() {
  const isApiConnected = await checkApiConnection()

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Better Nest Kit
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-3xl font-bold">Welcome</h1>
                <p className="text-muted-foreground text-balance">
                  A modern monorepo starter with NestJS and Next.js with
                  better-auth and oRPC
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-black/8 bg-black/5 p-4 text-sm transition-all dark:border-white/[.145] dark:bg-white/6">
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    isApiConnected
                      ? 'animate-pulse bg-emerald-500 shadow-[0_0_0_0_rgba(16,185,129,0.4)]'
                      : 'bg-red-500 shadow-[0_0_0_0_rgba(239,68,68,0.4)]'
                  }`}
                />
                <div>
                  <div className="font-medium opacity-90">
                    {isApiConnected ? 'API Connected' : 'API Disconnected'}
                  </div>
                  {!isApiConnected && (
                    <div className="text-[13px] opacity-60">
                      Start the NestJS server on port 3000
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button asChild variant="default" className="w-full">
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background text-muted-foreground px-2">
                    Resources
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="secondary" className="flex-1">
                  <a
                    href="https://turborepo.com/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Documentation
                  </a>
                </Button>
                <Button asChild variant="secondary" className="flex-1">
                  <a
                    href="https://vercel.com/templates?search=turborepo"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Examples
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted/30 relative hidden items-center justify-center overflow-hidden p-10 lg:flex">
        <div className="absolute inset-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-size-[16px_16px] dark:bg-[radial-gradient(#ffffff22_1px,transparent_1px)]" />
        <TechStackVisual />
      </div>
    </div>
  )
}
