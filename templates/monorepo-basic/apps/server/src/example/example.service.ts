import { Injectable, NotFoundException } from '@nestjs/common'
import { UserRepository } from './repositories/user.repository'
import type { CreateUser, UpdateUser } from '@marifa/types/user'

@Injectable()
export class ExampleService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAllUsers() {
    return this.userRepository.findAll()
  }

  async findUserById(id: string) {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }
    return user
  }

  async createUser(data: CreateUser) {
    // Check if user already exists
    const existing = await this.userRepository.findByEmail(data.email)
    if (existing) {
      throw new NotFoundException(
        `User with email ${data.email} already exists`
      )
    }
    return this.userRepository.create(data)
  }

  async updateUser(id: string, data: UpdateUser) {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }
    const updated = await this.userRepository.update(id, data)
    if (!updated) {
      throw new NotFoundException(`Failed to update user with ID ${id}`)
    }
    return updated
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }
    await this.userRepository.delete(id)
  }
}
