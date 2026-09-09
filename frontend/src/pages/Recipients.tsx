import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'
import type { Recipient } from '../types'

export function Recipients() {
  const { lang, t } = useI18n()
  const [rows, setRows] = useState<Recipient[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [relationship, setRelationship] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = () => void api.recipients().then(setRows)
  useEffect(() => {
    load()
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await api.addRecipient({ name, email, relationship: relationship || undefined })
      setName('')
      setEmail('')
      setRelationship('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div>
      <h1>{t('recipients')}</h1>
      <p className="muted">
        {lang === 'zh'
          ? '接收人完全可选。第一档不需要任何人。邮箱用于第三档通知，明文保存。'
          : 'Recipients are optional. Tier 1 needs none. Email is stored in plaintext for tier-3 notices.'}
      </p>
      <form className="card form-grid" onSubmit={onSubmit} style={{ marginBottom: '1rem' }}>
        <label>
          {lang === 'zh' ? '姓名' : 'Name'}
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          {t('email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          {lang === 'zh' ? '关系（可选）' : 'Relationship (optional)'}
          <input value={relationship} onChange={(e) => setRelationship(e.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit">
          {lang === 'zh' ? '添加' : 'Add'}
        </button>
      </form>
      <div className="item-list">
        {rows.map((row) => (
          <article key={row.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <strong>{row.name}</strong>
              <div className="muted">
                {row.email}
                {row.relationship ? ` · ${row.relationship}` : ''}
              </div>
            </div>
            <button
              className="btn ghost"
              type="button"
              onClick={async () => {
                await api.deleteRecipient(row.id)
                load()
              }}
            >
              {t('delete')}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
