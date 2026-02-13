import * as dotenv from 'dotenv'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

dotenv.config({
  path: '../../apps/server/.env'
})

const connectionString = `${process.env.DATABASE_URL}`

export const adapter = new PrismaPg({ connectionString })
export const prisma = new PrismaClient({ adapter })
export * from './generated/prisma/client'
