import { Injectable } from '@nestjs/common'
import { PrismaService } from '#/database/prisma.service'
import type { User, CreateUser, UpdateUser } from '@marifa/types/user'

// Helper to transform Prisma User (with Date) to API User (with ISO string)
type PrismaUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: string | null
  createdAt: Date
  updatedAt: Date
}

const toUser = (prismaUser: PrismaUser): User => ({
  ...prismaUser,
  createdAt: prismaUser.createdAt.toISOString(),
  updatedAt: prismaUser.updatedAt.toISOString()
})

const userSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  role: true,
  createdAt: true,
  updatedAt: true
} as const

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({ select: userSelect })
    return users.map(toUser)
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect
    })
    return user ? toUser(user) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: userSelect
    })
    return user ? toUser(user) : null
  }

  async create(data: CreateUser): Promise<User> {
    // Note: In real usage, password should be hashed before storing
    // This is just an example - Better Auth handles user creation
    const user = await this.prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        emailVerified: false
      },
      select: userSelect
    })
    return toUser(user)
  }

  async update(id: string, data: UpdateUser): Promise<User | null> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: userSelect
    })
    return user ? toUser(user) : null
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    })
  }
}
