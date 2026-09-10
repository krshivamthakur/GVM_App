export interface CometChatServerUser {
  id: string
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
  role?: string
}

/**
 * Server-side creation of a CometChat user via CometChat v3 REST API.
 * Automatically provisions users in CometChat cloud whenever a user is added or registered.
 */
export async function createCometChatUserServer(
  user: CometChatServerUser
): Promise<{ success: boolean; data?: any; error?: string }> {
  const appId = process.env.NEXT_PUBLIC_COMETCHAT_APP_ID?.trim()
  const region = process.env.NEXT_PUBLIC_COMETCHAT_REGION?.trim() || 'us'
  const authKey = process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY?.trim()

  if (!appId || !authKey) {
    console.warn('[CometChat Server] Credentials not configured in environment, skipping auto chat user creation.')
    return { success: false, error: 'CometChat credentials missing' }
  }

  // Sanitize UID to match CometChat format requirements
  const uid = user.id.replace(/[^a-zA-Z0-9_-]/g, '_')
  const name = user.full_name?.trim() || user.email?.split('@')[0] || 'LMS User'
  const avatar =
    user.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'

  try {
    const endpoint = `https://${appId}.api-${region}.cometchat.io/v3/users`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apiKey: authKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        uid,
        name,
        avatar,
        role: 'default'
      })
    })

    const json = await res.json()

    if (res.ok && json.data) {
      console.log(`[CometChat Server] Successfully auto-created CometChat user for UID: ${uid} (${name})`)
      return { success: true, data: json.data }
    }

    // If user already exists in CometChat tenant, treat as success
    if (json.error?.code === 'ERR_UID_ALREADY_EXISTS') {
      console.log(`[CometChat Server] CometChat user already exists for UID: ${uid}`)
      return { success: true, data: json.error }
    }

    console.warn(`[CometChat Server] Unexpected response during user creation:`, json)
    return { success: false, error: json.error?.message || 'Failed to create CometChat user' }
  } catch (err: any) {
    console.error('[CometChat Server] Exception while auto-creating CometChat user:', err)
    return { success: false, error: err.message || 'Unknown network error' }
  }
}
