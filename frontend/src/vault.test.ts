import { describe, expect, it } from 'vitest'
import { randomSalt } from './crypto'
import {
  resetLocalVaultStorage,
  unlockVault,
  VAULT_CANARY,
  VAULT_SESSION_KEY,
  VaultMismatchError,
  vaultCanaryKey,
  type KvStore,
} from './vault'

function memoryStore(): KvStore {
  const map = new Map<string, string>()
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
}

describe('client vault canary', () => {
  const user = { id: 'user-1', cryptoSalt: randomSalt() }

  it('creates a canary and remembers the login password locally', async () => {
    const stores = { local: memoryStore(), session: memoryStore() }
    await unlockVault('DemoPass123!', user, stores)
    const raw = stores.local.getItem(vaultCanaryKey(user.id))
    expect(raw).toBeTruthy()
    expect(raw).not.toContain(VAULT_CANARY)
    expect(stores.session.getItem(VAULT_SESSION_KEY)).toBe('DemoPass123!')
  })

  it('unlocks again with the same password', async () => {
    const stores = { local: memoryStore(), session: memoryStore() }
    await unlockVault('DemoPass123!', user, stores)
    await expect(unlockVault('DemoPass123!', user, stores)).resolves.toBeTruthy()
  })

  it('rejects a different passphrase against an existing canary', async () => {
    const stores = { local: memoryStore(), session: memoryStore() }
    await unlockVault('old-vault-phrase', user, stores)
    await expect(unlockVault('DemoPass123!', user, stores)).rejects.toBeInstanceOf(VaultMismatchError)
    expect(stores.local.getItem(vaultCanaryKey(user.id))).toBeTruthy()
  })

  it('reset deletes local canary then re-unlocks with the login password', async () => {
    const stores = { local: memoryStore(), session: memoryStore() }
    await unlockVault('old-vault-phrase', user, stores)
    resetLocalVaultStorage(user.id, stores)
    expect(stores.local.getItem(vaultCanaryKey(user.id))).toBeNull()
    expect(stores.session.getItem(VAULT_SESSION_KEY)).toBeNull()
    await unlockVault('DemoPass123!', user, stores)
    expect(stores.session.getItem(VAULT_SESSION_KEY)).toBe('DemoPass123!')
  })
})
