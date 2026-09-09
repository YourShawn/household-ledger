import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { useSession } from '../session'

export function Unlock() {
  const { t } = useI18n()
  const { unlock, user } = useSession()
  const [pass, setPass] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await unlock(pass)
    } catch {
      setError('Unable to unlock — check the vault passphrase.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="unlock-overlay">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h2>{t('unlock')}</h2>
        <p className="muted">
          {user?.email} · {t('vault')}
        </p>
        <p className="muted">
          This passphrase never leaves the browser. It is not the login password unless you chose the same
          phrase.
        </p>
        <label>
          {t('vault')}
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required minLength={8} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <div className="row-actions">
          <button className="btn" disabled={busy} type="submit">
            {t('unlock')}
          </button>
        </div>
      </form>
    </div>
  )
}
