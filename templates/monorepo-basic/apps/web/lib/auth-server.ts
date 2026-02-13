import { headers } from 'next/headers'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL

export async function getServerSession() {
  const headersList = await headers()
  const cookie = headersList.get('cookie')

  if (!cookie) {
    return null
  }

  try {
    const response = await fetch(`${SERVER_URL}/api/auth/get-session`, {
      headers: {
        cookie
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return null
    }

    const session = await response.json()
    return session
  } catch (error) {
    console.error('[getServerSession] Error:', error)
    return null
  }
}
