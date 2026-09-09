import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from './api'
import type { User } from './types'
import { resetLocalVaultStorage, unlockVault, VAULT_SESSION_KEY } from './vault'

type Session = {
  user: User | null
  key: CryptoKey | null
  loading: boolean
  unlocking: boolean
  vaultMismatch: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  unlock: (passphrase: string) => Promise<void>
  resetLocalVault: (passphrase?: string) => Promise<void>
  lock: () => void
  refresh: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const [vaultMismatch, setVaultMismatch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingPassRef = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await api.me()
      setUser(me)
      if (sessionStorage.getItem(VAULT_SESSION_KEY)) setUnlocking(true)
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
    pendingPassRef.current = password
    setUnlocking(true)
    setVaultMismatch(false)
    try {
      const derived = await unlockVault(password, next)
      setKey(derived)
    } catch {
      setKey(null)
      setVaultMismatch(true)
    } finally {
      setUnlocking(false)
    }
  }

  const unlock = useCallback(
    async (passphrase: string) => {
      if (!user) throw new Error('Not signed in')
      try {
        const derived = await unlockVault(passphrase, user)
        pendingPassRef.current = passphrase
        setKey(derived)
        setVaultMismatch(false)
        setError(null)
      } catch (err) {
        setVaultMismatch(true)
        throw err
      }
    },
    [user],
  )

  const resetLocalVault = useCallback(
    async (passphrase?: string) => {
      if (!user) throw new Error('Not signed in')
      resetLocalVaultStorage(user.id)
      setVaultMismatch(false)
      const pass = passphrase || pendingPassRef.current
      if (!pass) {
        setKey(null)
        return
      }
      const derived = await unlockVault(pass, user)
      pendingPassRef.current = pass
      setKey(derived)
      setError(null)
    },
    [user],
  )

  const value = useMemo<Session>(
    () => ({
      user,
      key,
      loading,
      unlocking,
      vaultMismatch,
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
        setVaultMismatch(false)
        pendingPassRef.current = null
        sessionStorage.removeItem(VAULT_SESSION_KEY)
      },
      unlock,
      resetLocalVault,
      lock: () => {
        setKey(null)
        sessionStorage.removeItem(VAULT_SESSION_KEY)
      },
      refresh,
    }),
    [user, key, loading, unlocking, vaultMismatch, error, unlock, resetLocalVault, refresh],
  )

  useEffect(() => {
    if (!user || key) return
    const stored = sessionStorage.getItem(VAULT_SESSION_KEY)
    if (!stored) return
    let cancelled = false
    void unlockVault(stored, user)
      .then((derived) => {
        if (cancelled) return
        setKey(derived)
        setVaultMismatch(false)
      })
      .catch(() => {
        if (cancelled) return
        sessionStorage.removeItem(VAULT_SESSION_KEY)
        setVaultMismatch(true)
      })
      .finally(() => {
        if (!cancelled) setUnlocking(false)
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
