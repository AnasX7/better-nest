import { api } from '@/lib/axios'
import type { Message } from '@marifa/types/example'

export const helloService = {
  getHello: async (): Promise<Message> => {
    const response = await api.get<Message>('/')
    return response.data
  }
}
