import { env } from '@repo/env/web'
import type { CreatePostDto, PostResponse, StandardResponse, UpdatePostDto } from '@repo/contracts'

export interface ApiClientOptions {
  baseUrl?: string
  fetchFn?: typeof fetch
}

export class ApiClient {
  private readonly baseUrl: string
  private readonly fetchFn: typeof fetch

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? `${env.NEXT_PUBLIC_API_URL}/api`
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis)
  }

  private async request<T>(path: string, options?: RequestInit): Promise<StandardResponse<T>> {
    const url = `${this.baseUrl}${path}`
    const res = await this.fetchFn(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    })

    const body = await res.json()
    if (!res.ok) {
      throw new Error(body.message || `Request failed with status ${res.status}`)
    }

    return body as StandardResponse<T>
  }

  readonly posts = {
    list: (limit = 20, offset = 0) =>
      this.request<PostResponse[]>(`/posts?limit=${limit}&offset=${offset}`),

    getById: (id: string) => this.request<PostResponse>(`/posts/${id}`),

    create: (dto: CreatePostDto) =>
      this.request<PostResponse>('/posts', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),

    update: (id: string, dto: UpdatePostDto) =>
      this.request<PostResponse>(`/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),

    delete: (id: string) =>
      this.request<{ success: boolean }>(`/posts/${id}`, {
        method: 'DELETE',
      }),
  }
}

export const api = new ApiClient()
