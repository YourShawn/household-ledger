import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { decryptJson } from '../crypto'
import { useI18n } from '../i18n'
import { useSession } from '../session'
import { KINDS, kindMeta, type EncryptedItem, type ItemKind } from '../types'

export function Items() {
  const { lang, t } = useI18n()
  const { key } = useSession()
  const [params, setParams] = useSearchParams()
  const kind = (params.get('kind') as ItemKind | null) || undefined
  const [rows, setRows] = useState<EncryptedItem[]>([])
  const [titles, setTitles] = useState<Record<string, string>>({})

  useEffect(() => {
    void api.items(kind).then(setRows)
  }, [kind])

  useEffect(() => {
    if (!key) return
    let cancelled = false
    void (async () => {
      const next: Record<string, string> = {}
      for (const row of rows) {
        try {
          const payload = await decryptJson<Record<string, string>>(row.ciphertext, row.nonce, key)
          next[row.id] = payload.name || (lang === 'zh' ? '未命名' : 'Untitled')
        } catch {
          next[row.id] = lang === 'zh' ? '无法解密' : 'Cannot decrypt'
        }
      }
      if (!cancelled) setTitles(next)
    })()
    return () => {
      cancelled = true
    }
  }, [rows, key, lang])

  return (
    <div>
      <div className="topbar">
        <h1>{t('ledger')}</h1>
        <Link className="btn" to="/app/items/new">
          {t('addItem')}
        </Link>
      </div>
      <div className="filter-row">
        <button className={!kind ? 'chip on' : 'chip'} type="button" onClick={() => setParams({})}>
          {lang === 'zh' ? '全部' : 'All'}
        </button>
        {KINDS.map((k) => (
          <button
            key={k.id}
            className={kind === k.id ? 'chip on' : 'chip'}
            type="button"
            onClick={() => setParams({ kind: k.id })}
          >
            {lang === 'zh' ? k.zh : k.en}
          </button>
        ))}
      </div>
      <div className="item-list">
        {rows.map((row) => {
          const meta = kindMeta(row.kind)
          return (
            <Link key={row.id} className="card item-row" to={`/app/items/${row.id}`}>
              <div className="glyph">{meta.glyph}</div>
              <div>
                <strong>{titles[row.id] ?? '••••'}</strong>
                <div className="muted">{lang === 'zh' ? meta.zh : meta.en}</div>
              </div>
            </Link>
          )
        })}
        {rows.length === 0 ? <p className="muted">{lang === 'zh' ? '尚无记录' : 'No entries yet'}</p> : null}
      </div>
    </div>
  )
}
