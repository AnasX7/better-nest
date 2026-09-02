import { vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { DatabaseService } from '@/database/database.service'
import { AppModule } from '@/app.module'

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue({
        db: {
          execute: vi.fn().mockResolvedValue([{ 1: 1 }]),
        },
        client: { end: vi.fn().mockResolvedValue(undefined) },
      })
      .compile()

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    )
    app.setGlobalPrefix('api', {
      exclude: ['health', 'docs'],
    })
    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  it('/api (GET)', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/api',
    })
    expect(result.statusCode).toBe(200)
    const json = JSON.parse(result.payload)
    expect(json).toMatchObject({
      statusCode: 200,
      success: true,
      data: 'Hello World!',
    })
    expect(json.meta?.timestamp).toBeDefined()
  })

  it('/health (GET)', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/health',
    })
    expect(result.statusCode).toBe(200)
    const json = JSON.parse(result.payload)
    expect(json.status).toBe('ok')
    expect(json.info?.database?.status).toBe('up')
  })

  afterEach(async () => {
    await app.close()
  })
})
