import { decryptJson, deriveKey, encryptJson } from './crypto'
import type { User } from './types'

export const VAULT_CANARY = 'household-ledger-canary-v1'
export const VAULT_SESSION_KEY = 'hl.vault'

export type KvStore = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export class VaultMismatchError extends Error {
  constructor() {
    super('Passphrase mismatch')
    this.name = 'VaultMismatchError'
  }
}

export function vaultCanaryKey(userId: string) {
  return `hl.canary.${userId}`
}

function browserStores(): { local: KvStore; session: KvStore } {
  return { local: globalThis.localStorage, session: globalThis.sessionStorage }
}

export async function unlockVault(
  passphrase: string,
  user: Pick<User, 'id' | 'cryptoSalt'>,
  stores: { local: KvStore; session: KvStore } = browserStores(),
): Promise<CryptoKey> {
  const derived = await deriveKey(passphrase, user.cryptoSalt)
  const canaryKey = vaultCanaryKey(user.id)
  const existing = stores.local.getItem(canaryKey)
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as { ciphertext: string; nonce: string }
      const text = await decryptJson<string>(parsed.ciphertext, parsed.nonce, derived)
      if (text !== VAULT_CANARY) throw new VaultMismatchError()
    } catch (err) {
      if (err instanceof VaultMismatchError) throw err
      throw new VaultMismatchError()
    }
  } else {
    const enc = await encryptJson(VAULT_CANARY, derived)
    stores.local.setItem(canaryKey, JSON.stringify(enc))
  }
  stores.session.setItem(VAULT_SESSION_KEY, passphrase)
  return derived
}

export function resetLocalVaultStorage(
  userId: string,
  stores: { local: KvStore; session: KvStore } = browserStores(),
) {
  stores.local.removeItem(vaultCanaryKey(userId))
  stores.session.removeItem(VAULT_SESSION_KEY)
}

/** Unlock with login password; on canary mismatch, silently reset local vault and retry once. */
export async function unlockVaultOrResetOnMismatch(
  passphrase: string,
  user: Pick<User, 'id' | 'cryptoSalt'>,
  stores: { local: KvStore; session: KvStore } = browserStores(),
): Promise<CryptoKey> {
  try {
    return await unlockVault(passphrase, user, stores)
  } catch (err) {
    if (!(err instanceof VaultMismatchError)) throw err
    resetLocalVaultStorage(user.id, stores)
    return await unlockVault(passphrase, user, stores)
  }
}
