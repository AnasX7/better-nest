'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@repo/api'
import type { CreatePostDto } from '@repo/contracts'
import { authClient } from '@/lib/auth-client'
import { Button } from '@repo/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/ui/card'
import { Input } from '@repo/ui/components/ui/input'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Badge } from '@repo/ui/components/ui/badge'
import { Alert, AlertDescription } from '@repo/ui/components/ui/alert'
import { PlusCircleIcon, LogOutIcon, LogInIcon } from 'lucide-react'

export default function Home() {
  const queryClient = useQueryClient()

  // 1. Better Auth: Use authClient directly
  const { data: session, isPending: sessionLoading } = authClient.useSession()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // 2. TanStack Query: fetch posts from NestJS backend via @repo/contracts
  const {
    data: postsResponse,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ['posts'],
    queryFn: () => api.posts.list(),
  })

  // 3. TanStack Query: mutate post
  const createPostMutation = useMutation({
    mutationFn: (dto: CreatePostDto) => api.posts.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      setTitle('')
      setContent('')
      setFormError(null)
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError('Title must be at least 3 characters')
      return
    }
    createPostMutation.mutate({ title, content: content || undefined })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Card */}
      <Card className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">
              ⚡ Next.js 16 + React 19 Compiler + NestJS v12
            </Badge>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
            End-to-End Type Safety Monorepo
          </CardTitle>
          <CardDescription className="text-sm">
            Shared Zod schemas in{' '}
            <code className="text-indigo-300 font-mono text-xs">@repo/contracts</code> validate
            requests in NestJS and provide typed API clients with TanStack Query.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Grid: Auth Status & Post Creator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Auth Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Authentication</CardTitle>
              <Badge variant="secondary">Better Auth</Badge>
            </div>
            <CardDescription className="text-xs">
              Direct <code>authClient</code> instance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionLoading ? (
              <p className="text-xs text-muted-foreground">Checking session...</p>
            ) : session?.user ? (
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs flex flex-col gap-1">
                  <span className="font-semibold text-foreground">{session.user.name}</span>
                  <span className="text-muted-foreground truncate">{session.user.email}</span>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      Role: {session.user.role ?? 'user'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => authClient.signOut()}
                  className="w-full"
                >
                  <LogOutIcon className="size-3.5 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-xs text-muted-foreground">
                <p>Sign in to test protected endpoints and session validation.</p>
                <Button
                  size="sm"
                  onClick={() =>
                    authClient.signIn.email({
                      email: 'admin@example.com',
                      password: 'password123',
                    })
                  }
                  className="w-full"
                >
                  <LogInIcon className="size-3.5 mr-2" />
                  Sign In as Admin Demo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Post Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Create Post</CardTitle>
              <Badge variant="secondary">Zod Schema Validation</Badge>
            </div>
            <CardDescription className="text-xs">
              Validates input via <code>createPostSchema</code> from <code>@repo/contracts</code>
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreatePost}>
            <CardContent className="flex flex-col gap-3">
              <Input
                placeholder="Post title (min 3 characters)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Post content (optional)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
              />
              {formError && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">{formError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" size="sm" disabled={createPostMutation.isPending}>
                <PlusCircleIcon className="size-3.5 mr-2" />
                {createPostMutation.isPending ? 'Publishing...' : 'Publish Post'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Posts Feed */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Posts Feed</h2>
            <Badge variant="secondary">TanStack Query</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            Total: {postsResponse?.data?.length ?? 0}
          </span>
        </div>

        {postsLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Loading posts from NestJS backend...
          </div>
        ) : postsError ? (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">
              Could not fetch posts. Make sure backend is running on port 3001. (
              {postsError.message})
            </AlertDescription>
          </Alert>
        ) : postsResponse?.data?.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground border-dashed">
            No posts found. Create one above or run <code>bun run db:seed</code> in apps/api.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {postsResponse?.data?.map((post) => (
              <Card key={post.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{post.title}</CardTitle>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {post.content && (
                    <CardDescription className="text-xs line-clamp-3">
                      {post.content}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardFooter className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t">
                  <span>Author: {post.author?.name ?? 'Anonymous'}</span>
                  <span className="font-mono text-[10px]">ID: {post.id.slice(0, 8)}...</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
