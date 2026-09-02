import { describe, expect, it } from 'vitest'
import { cn } from '@repo/ui/lib/utils'

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const isHidden = false
    const result = cn('bg-red-500', 'p-4', isHidden && 'hidden', 'text-white')
    expect(result).toBe('bg-red-500 p-4 text-white')
  })

  it('should handle tailwind conflict resolution', () => {
    const result = cn('px-2 py-1', 'p-4')
    expect(result).toBe('p-4')
  })
})
