import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { decryptJson, deriveKey } from '../crypto'
import { fieldLabel, useI18n } from '../i18n'
import { kindMeta, type ItemKind, type PublicShare } from '../types'

type Bundle = { items: { kind: ItemKind; payload: Record<string, string> }[] }

export function ShareView() {
  const { token } = useParams()
  const { lang, t } = useI18n()
  const [share, setShare] = useState<PublicShare | null>(null)
  const [pass, setPass] = useState('')
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    void api
      .publicShare(token)
      .then(setShare)
      .catch(() => setError(lang === 'zh' ? '链接无效或已过期' : 'Link missing or expired'))
  }, [token, lang])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!share) return
    setError(null)
    try {
      const key = await deriveKey(pass, share.kdfSalt)
      setBundle(await decryptJson<Bundle>(share.ciphertext, share.nonce, key))
    } catch {
      setError(lang === 'zh' ? '口令不正确' : 'Wrong passphrase')
    }
  }

  return (
    <div className="landing">
      <h1>{lang === 'zh' ? '密文包' : 'Encrypted bundle'}</h1>
      <p className="warn">{t('disclaimer')}</p>
      {!bundle ? (
        <form className="card form-grid" onSubmit={onSubmit}>
          <p className="muted">
            {lang === 'zh' ? '服务器只给了密文。请输入对方另行告知的口令。' : 'The server only handed you ciphertext. Enter the phrase shared out of band.'}
          </p>
          <label>
            {lang === 'zh' ? '解锁口令' : 'Unlock phrase'}
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit" disabled={!share}>
            {t('unlock')}
          </button>
        </form>
      ) : (
        <div className="item-list">
          {bundle.items.map((item, idx) => {
            const meta = kindMeta(item.kind)
            return (
              <article key={idx} className="card">
                <h3>
                  {meta.glyph} {lang === 'zh' ? meta.zh : meta.en}
                </h3>
                {meta.fields.map((field) => (
                  <p key={field.key}>
                    <span className="muted">{fieldLabel(field.zh, field.en, lang)} · </span>
                    {item.payload[field.key]}
                  </p>
                ))}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
