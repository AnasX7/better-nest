export interface StandardResponse<T> {
  statusCode: number
  success: boolean
  message?: string
  data: T
  meta?: Record<string, unknown>
}
