import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ExampleController } from '#/example/example.controller'
import { ExampleService } from '#/example/example.service'
import type { User } from '@repo/types/user'

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

describe('ExampleController', () => {
  let controller: ExampleController
  let service: ExampleService

  // Mock service methods
  const mockExampleService = {
    findAllUsers: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn()
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExampleController],
      providers: [
        {
          provide: ExampleService,
          useValue: mockExampleService
        }
      ]
    }).compile()

    controller = module.get<ExampleController>(ExampleController)
    service = module.get<ExampleService>(ExampleService)
  })

  describe('findAll', () => {
    it('should return an array of users', async () => {
      mockExampleService.findAllUsers.mockResolvedValue(mockUsers)

      const result = await controller.findAll()

      expect(result).toEqual(mockUsers)
      expect(mockExampleService.findAllUsers).toHaveBeenCalledTimes(1)
    })
  })

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockExampleService.findUserById.mockResolvedValue(mockUser)

      const result = await controller.findOne({ id: mockUser.id })

      expect(result).toEqual(mockUser)
      expect(mockExampleService.findUserById).toHaveBeenCalledWith(mockUser.id)
    })

    it('should propagate NotFoundException from service', async () => {
      mockExampleService.findUserById.mockRejectedValue(
        new NotFoundException('User not found')
      )

      await expect(controller.findOne({ id: 'invalid-id' })).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('create', () => {
    const createDto = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'securepassword123'
    }

    it('should create and return a new user', async () => {
      const newUser = {
        ...mockUser,
        name: createDto.name,
        email: createDto.email
      }
      mockExampleService.createUser.mockResolvedValue(newUser)

      const result = await controller.create(createDto)

      expect(result).toEqual(newUser)
      expect(mockExampleService.createUser).toHaveBeenCalledWith(createDto)
    })
  })

  describe('update', () => {
    const updateDto = { name: 'John Updated' }

    it('should update and return the user', async () => {
      const updatedUser = { ...mockUser, name: updateDto.name }
      mockExampleService.updateUser.mockResolvedValue(updatedUser)

      const result = await controller.update({ id: mockUser.id }, updateDto)

      expect(result).toEqual(updatedUser)
      expect(mockExampleService.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        updateDto
      )
    })

    it('should propagate NotFoundException from service', async () => {
      mockExampleService.updateUser.mockRejectedValue(
        new NotFoundException('User not found')
      )

      await expect(
        controller.update({ id: 'invalid-id' }, updateDto)
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('delete', () => {
    it('should delete user and return success message', async () => {
      mockExampleService.deleteUser.mockResolvedValue(undefined)

      const result = await controller.delete({ id: mockUser.id })

      expect(result).toEqual({ message: 'User deleted successfully' })
      expect(mockExampleService.deleteUser).toHaveBeenCalledWith(mockUser.id)
    })

    it('should propagate NotFoundException from service', async () => {
      mockExampleService.deleteUser.mockRejectedValue(
        new NotFoundException('User not found')
      )

      await expect(controller.delete({ id: 'invalid-id' })).rejects.toThrow(
        NotFoundException
      )
    })
  })
})
