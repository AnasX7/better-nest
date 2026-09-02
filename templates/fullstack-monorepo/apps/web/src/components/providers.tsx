'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Toaster } from '@repo/ui/components/ui/sonner'
import { DirectionProvider } from '@repo/ui/components/ui/direction'

export interface ProvidersProps {
  children: ReactNode
  direction?: 'ltr' | 'rtl'
}

export default function Providers({ children, direction = 'ltr' }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <DirectionProvider direction={direction}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors />
      </QueryClientProvider>
    </DirectionProvider>
  )
}
