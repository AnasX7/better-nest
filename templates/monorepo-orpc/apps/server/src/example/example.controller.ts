import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { ExampleService } from './example.service'
import {
  UserDto,
  CreateUserDto,
  UpdateUserDto,
  UserParamsDto
} from './dto/user.dto'

@ApiTags('Example')
@Controller('example/users')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ZodResponse({ status: 200, description: 'List of users', type: [UserDto] })
  async findAll() {
    return this.exampleService.findAllUsers()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ZodResponse({ status: 200, description: 'User found', type: UserDto })
  async findOne(@Param() params: UserParamsDto) {
    return this.exampleService.findUserById(params.id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ZodResponse({ status: 201, description: 'User created', type: UserDto })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.exampleService.createUser(createUserDto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ZodResponse({ status: 200, description: 'User updated', type: UserDto })
  async update(
    @Param() params: UserParamsDto,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.exampleService.updateUser(params.id, updateUserDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param() params: UserParamsDto) {
    await this.exampleService.deleteUser(params.id)
    return { message: 'User deleted successfully' }
  }
}
