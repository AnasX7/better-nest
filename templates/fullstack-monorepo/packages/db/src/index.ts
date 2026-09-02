import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@repo/env/server'
import * as schema from './schema'

export * from './schema'

export function createDbClient(url = env.DATABASE_URL) {
  const client = postgres(url, {
    max: env.DATABASE_MAX_CONNECTIONS,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  const db = drizzle(client, { schema })
  return { client, db }
}

export const { client, db } = createDbClient()
export type Database = typeof db
