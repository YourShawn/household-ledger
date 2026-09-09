import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from './api'
import { decryptJson, deriveKey, encryptJson } from './crypto'
import type { User } from './types'

type Session = {
  user: User | null
  key: CryptoKey | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  unlock: (passphrase: string) => Promise<void>
  lock: () => void
  refresh: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)
const CANARY = 'household-ledger-canary-v1'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await api.me()
      setUser(me)
    } catch {
      setToken('')
      setUser(null)
      setKey(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const afterAuth = async (token: string, next: User) => {
    setToken(token)
    setUser(next)
    setKey(null)
    setError(null)
  }

  const value = useMemo<Session>(
    () => ({
      user,
      key,
      loading,
      error,
      login: async (email, password) => {
        const res = await api.login({ email, password })
        await afterAuth(res.token, res.user)
      },
      register: async (email, password, displayName) => {
        const res = await api.register({ email, password, displayName })
        await afterAuth(res.token, res.user)
      },
      logout: () => {
        setToken('')
        setUser(null)
        setKey(null)
        sessionStorage.removeItem('hl.vault')
      },
      unlock: async (passphrase) => {
        if (!user) throw new Error('Not signed in')
        const derived = await deriveKey(passphrase, user.cryptoSalt)
        const canaryKey = `hl.canary.${user.id}`
        const existing = localStorage.getItem(canaryKey)
        if (existing) {
          const parsed = JSON.parse(existing) as { ciphertext: string; nonce: string }
          const text = await decryptJson<string>(parsed.ciphertext, parsed.nonce, derived)
          if (text !== CANARY) throw new Error('Passphrase mismatch')
        } else {
          const enc = await encryptJson(CANARY, derived)
          localStorage.setItem(canaryKey, JSON.stringify(enc))
        }
        sessionStorage.setItem('hl.vault', passphrase)
        setKey(derived)
        setError(null)
      },
      lock: () => {
        setKey(null)
        sessionStorage.removeItem('hl.vault')
      },
      refresh,
    }),
    [user, key, loading, error, refresh],
  )

  useEffect(() => {
    const stored = sessionStorage.getItem('hl.vault')
    if (user && stored && !key) {
      void value.unlock(stored).catch(() => sessionStorage.removeItem('hl.vault'))
    }
  }, [user, key, value])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('SessionProvider missing')
  return ctx
}
