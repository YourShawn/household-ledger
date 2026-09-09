import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { encryptJson } from '../crypto'
import { useI18n } from '../i18n'
import { useSession } from '../session'
import { kindMeta, SAMPLE_ITEMS, type Dashboard } from '../types'

export function Dashboard() {
  const { t, lang } = useI18n()
  const { key, refresh } = useSession()
  const [data, setData] = useState<Dashboard | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = async () => setData(await api.dashboard())
  useEffect(() => {
    void load()
  }, [])

  const due = data
    ? new Date(new Date(data.lastCheckInAt).getTime() + data.checkInIntervalDays * 86400000)
    : null

  return (
    <div>
      <h1>{t('overview')}</h1>
      <p className="warn">{t('disclaimer')}</p>
      {data ? (
        <div className="stats">
          <article className="card">
            <div className="muted">{lang === 'zh' ? '条目' : 'Entries'}</div>
            <h2>{data.itemCount}</h2>
          </article>
          <article className="card">
            <div className="muted">{t('recipients')}</div>
            <h2>{data.recipientCount}</h2>
          </article>
          <article className="card">
            <div className="muted">{lang === 'zh' ? '上次报到' : 'Last check-in'}</div>
            <h3>{new Date(data.lastCheckInAt).toLocaleString()}</h3>
            <p className="muted">
              {lang === 'zh' ? '下次应在' : 'Due by'} {due?.toLocaleDateString()}
            </p>
            <button
              className="btn"
              type="button"
              onClick={async () => {
                await api.checkIn()
                await refresh()
                await load()
                setMsg(lang === 'zh' ? '已报到' : 'Checked in')
              }}
            >
              {t('checkIn')}
            </button>
          </article>
        </div>
      ) : null}
      {msg ? <p className="ok">{msg}</p> : null}
      <div className="kind-grid" style={{ marginTop: '1.2rem' }}>
        {(data?.byKind ?? []).map((row) => {
          const meta = kindMeta(row.kind)
          return (
            <Link key={row.kind} className="card item-row" to={`/app/items?kind=${row.kind}`}>
              <div className="glyph">{meta.glyph}</div>
              <div>
                <strong>{lang === 'zh' ? meta.zh : meta.en}</strong>
                <div className="muted">{row.count}</div>
              </div>
            </Link>
          )
        })}
      </div>
      <div className="row-actions">
        <Link className="btn" to="/app/items/new">
          {t('addItem')}
        </Link>
        <button
          className="btn ghost"
          type="button"
          disabled={!key}
          onClick={async () => {
            if (!key) return
            for (const sample of SAMPLE_ITEMS) {
              const enc = await encryptJson(sample.payload, key)
              await api.createItem({ kind: sample.kind, ...enc })
            }
            await load()
            setMsg(lang === 'zh' ? '示例已加密写入' : 'Encrypted samples stored')
          }}
        >
          {t('samples')}
        </button>
      </div>
    </div>
  )
}
