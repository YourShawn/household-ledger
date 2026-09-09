import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from './api'
import type { User } from './types'
import { restoreVaultSession, unlockWithLoginPassword, VAULT_SESSION_KEY } from './vault'

type Session = {
  user: User | null
  key: CryptoKey | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  lock: () => void
  refresh: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

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

  const afterAuth = async (token: string, next: User, password: string) => {
    setToken(token)
    setUser(next)
    setError(null)
    const derived = await unlockWithLoginPassword(password, next)
    setKey(derived)
  }

  const value = useMemo<Session>(
    () => ({
      user,
      key,
      loading,
      error,
      login: async (email, password) => {
        const res = await api.login({ email, password })
        await afterAuth(res.token, res.user, password)
      },
      register: async (email, password, displayName) => {
        const res = await api.register({ email, password, displayName })
        await afterAuth(res.token, res.user, password)
      },
      logout: () => {
        setToken('')
        setUser(null)
        setKey(null)
        sessionStorage.removeItem(VAULT_SESSION_KEY)
      },
      lock: () => {
        setKey(null)
        sessionStorage.removeItem(VAULT_SESSION_KEY)
      },
      refresh,
    }),
    [user, key, loading, error, refresh],
  )

  useEffect(() => {
    if (!user || key) return
    let cancelled = false
    void restoreVaultSession(user)
      .then((derived) => {
        if (cancelled || !derived) return
        setKey(derived)
      })
      .catch(() => {
        if (!cancelled) sessionStorage.removeItem(VAULT_SESSION_KEY)
      })
    return () => {
      cancelled = true
    }
  }, [user, key])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('SessionProvider missing')
  return ctx
}
