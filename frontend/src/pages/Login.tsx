import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useI18n } from '../i18n'
import { useSession } from '../session'

export function Login() {
  const { t } = useI18n()
  const { login } = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('demo@household-ledger.local')
  const [password, setPassword] = useState('DemoPass123!')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/app')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>{t('login')}</h1>
        <p className="muted">{t('demoHint')}</p>
        <label>
          {t('email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          {t('password')}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <div className="row-actions">
          <button className="btn" disabled={busy} type="submit">
            {t('login')}
          </button>
          <Link to="/register">{t('register')}</Link>
        </div>
      </form>
    </div>
  )
}
