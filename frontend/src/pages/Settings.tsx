import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api'
import { decryptJson, encryptJson, randomSalt, deriveKey } from '../crypto'
import { useI18n } from '../i18n'
import { useSession } from '../session'
import type { EncryptedItem, Notice, ShareMeta, SharingTier } from '../types'

export function Settings() {
  const { lang, t } = useI18n()
  const { user, key, refresh } = useSession()
  const [tier, setTier] = useState<SharingTier>(user?.sharingTier ?? 'RECORD_ONLY')
  const [days, setDays] = useState(user?.checkInIntervalDays ?? 30)
  const [sharePass, setSharePass] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [shares, setShares] = useState<ShareMeta[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setTier(user.sharingTier)
      setDays(user.checkInIntervalDays)
    }
  }, [user])

  useEffect(() => {
    void api.shares().then(setShares)
    void api.notices().then(setNotices)
  }, [])

  const saveTier = async (e: FormEvent) => {
    e.preventDefault()
    await api.settings({ sharingTier: tier, checkInIntervalDays: days })
    await refresh()
    setMsg(lang === 'zh' ? '设置已保存' : 'Settings saved')
  }

  const bundleItems = async (items: EncryptedItem[]) => {
    if (!key) throw new Error('Unlock first')
    const decrypted = []
    for (const item of items) {
      const payload = await decryptJson<Record<string, string>>(item.ciphertext, item.nonce, key)
      decrypted.push({ kind: item.kind, payload })
    }
    const salt = randomSalt()
    const wrapKey = await deriveKey(sharePass || 'require-pass', salt)
    if (!sharePass) throw new Error(lang === 'zh' ? '请填写分享口令' : 'Set a share passphrase')
    const enc = await encryptJson({ v: 1, exportedAt: new Date().toISOString(), items: decrypted }, wrapKey)
    return { ...enc, kdfSalt: salt }
  }

  return (
    <div>
      <h1>{t('settings')}</h1>
      <p className="warn">{t('disclaimer')}</p>
      <form className="card form-grid" onSubmit={saveTier}>
        <h3>{lang === 'zh' ? '告知档位' : 'Sharing tier'}</h3>
        {(['RECORD_ONLY', 'MANUAL_SHARE', 'AUTO_SEND'] as SharingTier[]).map((value, i) => (
          <label key={value} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="radio" name="tier" checked={tier === value} onChange={() => setTier(value)} />
            {i === 0 ? t('tier1') : i === 1 ? t('tier2') : t('tier3')}
          </label>
        ))}
        <label>
          {lang === 'zh' ? '未报到天数（约一个月）' : 'Missed check-in days (~1 month)'}
          <input type="number" min={7} max={365} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </label>
        <button className="btn" type="submit">
          {t('save')}
        </button>
      </form>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h3>{lang === 'zh' ? '手动分享 / 自动发送包' : 'Manual share / auto-send bundle'}</h3>
        <p className="muted">
          {lang === 'zh'
            ? '口令与登录密码分开。接收人用此口令在浏览器解密，服务器看不到明文。'
            : 'Use a phrase separate from login. Recipients decrypt in the browser; the server never sees plaintext.'}
        </p>
        <label>
          {lang === 'zh' ? '分享口令' : 'Share passphrase'}
          <input type="password" value={sharePass} onChange={(e) => setSharePass(e.target.value)} minLength={8} />
        </label>
        <div className="row-actions">
          <button
            className="btn"
            type="button"
            disabled={!key}
            onClick={async () => {
              setError(null)
              try {
                const bundle = await bundleItems(await api.items())
                const share = await api.createShare(bundle)
                const url = `${window.location.origin}${share.retrievePath}`
                setLink(url)
                setShares(await api.shares())
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Share failed')
              }
            }}
          >
            {lang === 'zh' ? '生成分享链接' : 'Create share link'}
          </button>
          <button
            className="btn secondary"
            type="button"
            disabled={!key}
            onClick={async () => {
              setError(null)
              try {
                const bundle = await bundleItems(await api.items())
                await api.arm(bundle)
                await refresh()
                setMsg(lang === 'zh' ? '已武装逾期发送，并刷新了报到时间' : 'Auto-send armed; check-in timer reset')
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Arm failed')
              }
            }}
          >
            {lang === 'zh' ? '武装逾期自动发' : 'Arm auto-send'}
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={async () => {
              await api.disarm()
              await refresh()
            }}
          >
            {lang === 'zh' ? '解除武装' : 'Disarm'}
          </button>
        </div>
        {link ? <p className="share-box">{link}</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {msg ? <p className="ok">{msg}</p> : null}
        <p className="muted">
          {lang === 'zh' ? '武装状态' : 'Armed'}: {user?.autoSendArmed ? 'yes' : 'no'}
          {user?.autoSendTriggeredAt ? ` · fired ${user.autoSendTriggeredAt}` : ''}
        </p>
      </section>

      <h3 style={{ marginTop: '1.2rem' }}>{lang === 'zh' ? '已生成的链接' : 'Share links'}</h3>
      {shares.map((s) => (
        <p key={s.id} className="muted">
          {s.shareKind} · {s.retrievePath} · {s.expiresAt}
        </p>
      ))}
      <h3>{lang === 'zh' ? '发送记录' : 'Outbound notices'}</h3>
      {notices.map((n) => (
        <p key={n.id} className="muted">
          {n.recipientName} {n.recipientEmail} · {n.status}
        </p>
      ))}
    </div>
  )
}
