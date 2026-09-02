import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/config/env'
import * as schema from './schema'

async function seed() {
  console.log('🌱 Starting database seeding...')
  const client = postgres(env.DATABASE_URL, { max: 1 })
  const db = drizzle(client, { schema })

  try {
    const adminUser = await db
      .insert(schema.user)
      .values({
        id: 'usr_admin_seed',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        emailVerified: true,
      })
      .onConflictDoNothing()
      .returning()

    console.log(
      adminUser.length > 0
        ? '✅ Created admin user: admin@example.com'
        : 'ℹ️ Admin user already exists',
    )

    const demoPost = await db
      .insert(schema.posts)
      .values({
        title: 'Welcome to NestJS v12 + Drizzle',
        content:
          'This is an initial seed post demonstrating relations with Better Auth user model.',
        userId: 'usr_admin_seed',
      })
      .onConflictDoNothing()
      .returning()

    console.log(
      demoPost.length > 0
        ? '✅ Created demo post'
        : 'ℹ️ Demo post already exists',
    )

    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

await seed()
