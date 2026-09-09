import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useI18n } from '../i18n'
import { useSession } from '../session'

export function Register() {
  const { t } = useI18n()
  const { register } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register(email, password, displayName)
      navigate('/app')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>{t('register')}</h1>
        <p className="warn">{t('disclaimer')}</p>
        <label>
          {t('displayName')}
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </label>
        <label>
          {t('email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          {t('password')}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <div className="row-actions">
          <button className="btn" disabled={busy} type="submit">
            {t('register')}
          </button>
          <Link to="/login">{t('login')}</Link>
        </div>
      </form>
    </div>
  )
}
