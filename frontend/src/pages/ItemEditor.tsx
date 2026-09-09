import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { decryptJson, encryptJson } from '../crypto'
import { fieldLabel, useI18n } from '../i18n'
import { useSession } from '../session'
import { KINDS, kindMeta, type ItemKind } from '../types'

export function ItemEditor() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { lang, t } = useI18n()
  const { key, user, unlocking, ensureVaultKey, error: sessionError } = useSession()
  const [kind, setKind] = useState<ItemKind>('ASSET')
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const meta = kindMeta(kind)

  useEffect(() => {
    if (!user || key) return
    let cancelled = false
    setRetrying(true)
    void ensureVaultKey().finally(() => {
      if (!cancelled) setRetrying(false)
    })
    return () => {
      cancelled = true
    }
  }, [user, key, ensureVaultKey])

  useEffect(() => {
    if (isNew || !key || !id) return
    void (async () => {
      const item = await api.item(id)
      setKind(item.kind)
      try {
        setValues(await decryptJson<Record<string, string>>(item.ciphertext, item.nonce, key))
      } catch {
        setError(lang === 'zh' ? '无法解密此条' : 'Could not decrypt this entry')
      }
    })()
  }, [id, isNew, key, lang])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    let vaultKey = key
    if (!vaultKey) {
      vaultKey = await ensureVaultKey()
    }
    if (!vaultKey) {
      setError(lang === 'zh' ? '正在准备加密…请稍后再试' : 'Preparing encryption… try again in a moment')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload: Record<string, string> = {}
      for (const field of meta.fields) payload[field.key] = values[field.key] ?? ''
      const enc = await encryptJson(payload, vaultKey)
      if (isNew) await api.createItem({ kind, ...enc })
      else await api.updateItem(id!, { kind, ...enc })
      navigate('/app/items')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const preparing = Boolean(user) && !key
  const saveDisabled = busy || preparing || unlocking || retrying

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <h1>{isNew ? t('addItem') : lang === 'zh' ? '改记' : 'Edit entry'}</h1>
      <label>
        {lang === 'zh' ? '类型（一格一事）' : 'Kind (one meaning per field)'}
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as ItemKind)
            setValues({})
          }}
        >
          {KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {lang === 'zh' ? k.zh : k.en}
            </option>
          ))}
        </select>
      </label>
      {meta.fields.map((field) => (
        <label key={field.key}>
          {fieldLabel(field.zh, field.en, lang)}
          {field.multiline ? (
            <textarea
              value={values[field.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
            />
          ) : (
            <input
              value={values[field.key] ?? ''}
              placeholder={lang === 'zh' ? field.hintZh : field.hintEn}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
            />
          )}
        </label>
      ))}
      {preparing ? (
        <p className="muted">
          {lang === 'zh' ? '正在准备加密…' : 'Preparing encryption…'}
          {sessionError ? ` (${sessionError})` : ''}
          {' '}
          <button
            className="linkish"
            type="button"
            style={{ background: 'transparent', border: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => {
              setRetrying(true)
              void ensureVaultKey().finally(() => setRetrying(false))
            }}
          >
            {lang === 'zh' ? '重试' : 'Retry'}
          </button>
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="row-actions">
        <button className="btn" disabled={saveDisabled} type="submit">
          {preparing || unlocking || retrying
            ? lang === 'zh'
              ? '正在准备加密…'
              : 'Preparing…'
            : t('save')}
        </button>
        {!isNew ? (
          <button
            className="btn danger"
            type="button"
            onClick={async () => {
              if (!id) return
              if (!confirm(lang === 'zh' ? '删除此条？' : 'Delete this entry?')) return
              await api.deleteItem(id)
              navigate('/app/items')
            }}
          >
            {t('delete')}
          </button>
        ) : null}
        <button className="btn ghost" type="button" onClick={() => navigate(-1)}>
          {t('cancel')}
        </button>
      </div>
    </form>
  )
}
