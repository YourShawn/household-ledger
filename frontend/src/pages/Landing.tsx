import { Link } from 'react-router-dom'
import { KINDS } from '../types'
import { useI18n } from '../i18n'

export function Landing() {
  const { t, lang, toggle } = useI18n()
  return (
    <div className="landing">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="lang-toggle" onClick={toggle} type="button">
          {lang === 'zh' ? 'EN' : '中文'}
        </button>
      </div>
      <section className="hero">
        <div>
          <div className="seal">财</div>
          <h1>{t('appName')}</h1>
          <p className="lede">{t('tagline')}</p>
          <p className="muted">{t('capability')}</p>
          <div className="actions">
            <Link className="btn" to="/register">
              {t('register')}
            </Link>
            <Link className="btn secondary" to="/login">
              {t('login')}
            </Link>
          </div>
          <p className="muted">{t('demoHint')}</p>
        </div>
        <div className="card">
          <h3>{lang === 'zh' ? '一格一事' : 'One meaning per field'}</h3>
          <div className="kind-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {KINDS.map((k) => (
              <div key={k.id}>
                <strong>
                  {k.glyph} {lang === 'zh' ? k.zh : k.en}
                </strong>
                <div className="muted">{k.fields.map((f) => (lang === 'zh' ? f.zh : f.en)).join(' · ')}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <h2>{lang === 'zh' ? '三档告知，接收人可选' : 'Three tiers, recipients optional'}</h2>
      <div className="tier-grid">
        <article className="card">
          <h3>1. {t('tier1')}</h3>
          <p className="muted">
            {lang === 'zh' ? '只在本账本加密记录，不生成分享链接，也不发送。' : 'Encrypt in place. No share links, no send.'}
          </p>
        </article>
        <article className="card">
          <h3>2. {t('tier2')}</h3>
          <p className="muted">
            {lang === 'zh'
              ? '你主动打包密文链接；对方仍需你当面告知的口令。'
              : 'You mint a ciphertext link. Recipients still need the phrase you shared out of band.'}
          </p>
        </article>
        <article className="card">
          <h3>3. {t('tier3')}</h3>
          <p className="muted">
            {lang === 'zh'
              ? '指定接收人。约一个月未报到则自动发出密文包（需配置邮件，否则只记日志）。'
              : 'Name recipients. After about a month without check-in, the ciphertext bundle is sent (email if SMTP is set; otherwise logged).'}
          </p>
        </article>
      </div>
      <p className="muted">MIT · AES-256-GCM in the browser · MySQL ciphertext at rest</p>
    </div>
  )
}
