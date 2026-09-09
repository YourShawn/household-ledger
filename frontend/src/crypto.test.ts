import { describe, expect, it } from 'vitest'
import { decryptJson, deriveKey, encryptJson, randomSalt } from './crypto'

describe('client-side vault crypto', () => {
  it('round-trips JSON with PBKDF2 + AES-GCM', async () => {
    const salt = randomSalt()
    const key = await deriveKey('vault-passphrase', salt)
    const payload = { name: '备用钥匙', whereKept: '铁盒' }
    const enc = await encryptJson(payload, key)
    expect(enc.ciphertext).not.toContain('备用钥匙')
    const out = await decryptJson<typeof payload>(enc.ciphertext, enc.nonce, key)
    expect(out).toEqual(payload)
  })

  it('fails closed on a wrong passphrase', async () => {
    const salt = randomSalt()
    const good = await deriveKey('correct-horse', salt)
    const bad = await deriveKey('wrong-pass', salt)
    const enc = await encryptJson({ name: 'secret' }, good)
    await expect(decryptJson(enc.ciphertext, enc.nonce, bad)).rejects.toThrow()
  })
})
