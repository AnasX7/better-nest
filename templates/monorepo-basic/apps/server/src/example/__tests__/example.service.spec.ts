import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ExampleService } from '#/example/example.service'
import { UserRepository } from '#/example/repositories/user.repository'
import type { User } from '@marifa/types/user'

// Mock user data
const mockUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'John Doe',
  email: 'john@example.com',
  emailVerified: true,
  image: null,
  role: 'user',
  createdAt: '2026-02-07T12:00:00Z',
  updatedAt: '2026-02-07T12:00:00Z'
}

const mockUsers: User[] = [mockUser]

describe('ExampleService', () => {
  let service: ExampleService
  let userRepository: UserRepository

  // Mock repository methods
  const mockUserRepository = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExampleService,
        {
          provide: UserRepository,
          useValue: mockUserRepository
        }
      ]
    }).compile()

    service = module.get<ExampleService>(ExampleService)
    userRepository = module.get<UserRepository>(UserRepository)
  })

  describe('findAllUsers', () => {
    it('should return an array of users', async () => {
      mockUserRepository.findAll.mockResolvedValue(mockUsers)

      const result = await service.findAllUsers()

      expect(result).toEqual(mockUsers)
      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1)
    })

    it('should return an empty array when no users exist', async () => {
      mockUserRepository.findAll.mockResolvedValue([])

      const result = await service.findAllUsers()

      expect(result).toEqual([])
    })
  })

  describe('findUserById', () => {
    it('should return a user when found', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser)

      const result = await service.findUserById(mockUser.id)

      expect(result).toEqual(mockUser)
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id)
    })

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      await expect(service.findUserById('non-existent-id')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('createUser', () => {
    const createUserData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'securepassword123'
    }

    it('should create and return a new user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockUserRepository.create.mockResolvedValue({
        ...mockUser,
        name: createUserData.name,
        email: createUserData.email
      })

      const result = await service.createUser(createUserData)

      expect(result.name).toBe(createUserData.name)
      expect(result.email).toBe(createUserData.email)
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserData)
    })

    it('should throw when user with email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser)

      await expect(service.createUser(createUserData)).rejects.toThrow(
        NotFoundException
      )
      expect(mockUserRepository.create).not.toHaveBeenCalled()
    })
  })

  describe('updateUser', () => {
    const updateData = { name: 'John Updated' }

    it('should update and return the user', async () => {
      const updatedUser = { ...mockUser, name: updateData.name }
      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockUserRepository.update.mockResolvedValue(updatedUser)

      const result = await service.updateUser(mockUser.id, updateData)

      expect(result.name).toBe(updateData.name)
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        updateData
      )
    })

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      await expect(
        service.updateUser('non-existent-id', updateData)
      ).rejects.toThrow(NotFoundException)
      expect(mockUserRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('deleteUser', () => {
    it('should delete the user successfully', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockUserRepository.delete.mockResolvedValue(undefined)

      await expect(service.deleteUser(mockUser.id)).resolves.not.toThrow()
      expect(mockUserRepository.delete).toHaveBeenCalledWith(mockUser.id)
    })

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      await expect(service.deleteUser('non-existent-id')).rejects.toThrow(
        NotFoundException
      )
      expect(mockUserRepository.delete).not.toHaveBeenCalled()
    })
  })
})
