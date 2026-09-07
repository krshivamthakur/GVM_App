'use client'

import { CometChat } from '@cometchat/chat-sdk-javascript'
import { CometChatUIKit, UIKitSettingsBuilder } from '@cometchat/chat-uikit-react'

export interface CometChatCredentials {
  appId: string
  region: string
  authKey: string
}

export function getCometChatCredentials(): CometChatCredentials | null {
  let appId = process.env.NEXT_PUBLIC_COMETCHAT_APP_ID?.trim()
  let region = process.env.NEXT_PUBLIC_COMETCHAT_REGION?.trim()
  let authKey = process.env.NEXT_PUBLIC_COMETCHAT_AUTH_KEY?.trim()

  if ((!appId || !authKey) && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('edulms_platform_settings_v1')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.cometChat?.appId && parsed.cometChat?.authKey) {
          appId = parsed.cometChat.appId.trim()
          region = (parsed.cometChat.region || 'us').trim()
          authKey = parsed.cometChat.authKey.trim()
        }
      }
    } catch (e) {}
  }

  if (appId && region && authKey) {
    return { appId, region, authKey }
  }

  return null
}

export function isCometChatConfigured(): boolean {
  return getCometChatCredentials() !== null
}

let initPromise: Promise<boolean> | null = null

/**
 * Initializes CometChat SDK and UIKit on the client
 */
export async function initCometChat(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  if (CometChatUIKit.isInitialized()) {
    return true
  }

  if (initPromise) {
    return initPromise
  }

  const creds = getCometChatCredentials()
  if (!creds) {
    return false
  }

  initPromise = (async () => {
    try {
      const uikitSettings = new UIKitSettingsBuilder()
        .setAppId(creds.appId)
        .setRegion(creds.region)
        .setAuthKey(creds.authKey)
        .subscribePresenceForAllUsers()
        .build()

      await CometChatUIKit.init(uikitSettings)
      return true
    } catch (err) {
      console.error('Failed to initialize CometChat:', err)
      initPromise = null
      return false
    }
  })()

  return initPromise
}

/**
 * Ensures user is logged into CometChat, creating the user if needed
 */
export async function loginCometChat(user: {
  id: string
  full_name?: string | null
  email?: string
  avatar_url?: string | null
}): Promise<any> {
  const isInit = await initCometChat()
  if (!isInit) {
    throw new Error('CometChat is not initialized or credentials missing')
  }

  const loggedIn = CometChatUIKit.getLoggedInUser()
  const uid = user.id.replace(/[^a-zA-Z0-9_-]/g, '_')

  if (loggedIn && loggedIn.getUid() === uid) {
    return loggedIn
  }

  const creds = getCometChatCredentials()!

  try {
    const cometchatUser = await CometChatUIKit.login(uid)
    return cometchatUser
  } catch (err: any) {
    // If user does not exist in CometChat tenant yet, create it
    const displayName = user.full_name || user.email?.split('@')[0] || 'Student'
    try {
      const newUser = new CometChat.User(uid)
      newUser.setName(displayName)
      if (user.avatar_url) {
        newUser.setAvatar(user.avatar_url)
      }
      await CometChat.createUser(newUser, creds.authKey)
      return await CometChatUIKit.login(uid)
    } catch (createErr) {
      console.error('Failed to auto-create and login CometChat user:', createErr)
      throw createErr
    }
  }
}

export async function logoutCometChat(): Promise<void> {
  try {
    if (CometChatUIKit.isInitialized()) {
      await CometChatUIKit.logout()
    }
  } catch (err) {
    console.error('Error logging out of CometChat:', err)
  }
}
