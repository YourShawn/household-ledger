import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { useSession } from '../session'

export function Unlock() {
  const { t, lang } = useI18n()
  const { unlock, resetLocalVault, user, vaultMismatch } = useSession()
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
      setError(lang === 'zh' ? '无法打开保险柜，请核对口令。' : 'Unable to unlock — check the vault passphrase.')
    } finally {
      setBusy(false)
    }
  }

  const onReset = async () => {
    setBusy(true)
    setError(null)
    try {
      await resetLocalVault(pass || undefined)
    } catch {
      setError(lang === 'zh' ? '重置后仍无法打开保险柜。' : 'Reset finished, but unlock failed.')
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
        <p className="muted">{t('vaultHint')}</p>
        {vaultMismatch ? (
          <>
            <p className="error">{t('vaultMismatch')}</p>
            <p className="muted">{t('vaultResetWarn')}</p>
            <div className="row-actions">
              <button className="btn" disabled={busy} type="button" onClick={() => void onReset()}>
                {t('vaultReset')}
              </button>
            </div>
          </>
        ) : null}
        <label>
          {t('vault')}
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
            minLength={8}
            placeholder={lang === 'zh' ? '默认为登录密码' : 'Defaults to login password'}
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <div className="row-actions">
          <button className="btn secondary" disabled={busy} type="submit">
            {t('unlock')}
          </button>
        </div>
      </form>
    </div>
  )
}
