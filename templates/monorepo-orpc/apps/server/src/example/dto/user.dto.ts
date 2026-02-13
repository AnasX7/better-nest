import { createZodDto } from 'nestjs-zod'
import {
  userSchema,
  createUserSchema,
  updateUserSchema,
  userParamsSchema
} from '@repo/types/user'

// DTOs created from shared schemas using nestjs-zod
// This enables automatic validation and Swagger documentation

export class UserDto extends createZodDto(userSchema) {}

export class CreateUserDto extends createZodDto(createUserSchema) {}

export class UpdateUserDto extends createZodDto(updateUserSchema) {}

export class UserParamsDto extends createZodDto(userParamsSchema) {}
