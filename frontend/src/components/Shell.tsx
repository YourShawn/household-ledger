import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useSession } from '../session'

export function Shell() {
  const { t, toggle, lang } = useI18n()
  const { user, logout } = useSession()
  const navigate = useNavigate()

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">{t('appName')}</div>
        <NavLink to="/app" end className={({ isActive }) => (isActive ? 'active' : '')}>
          {t('overview')}
        </NavLink>
        <NavLink to="/app/items" className={({ isActive }) => (isActive ? 'active' : '')}>
          {t('ledger')}
        </NavLink>
        <NavLink to="/app/recipients" className={({ isActive }) => (isActive ? 'active' : '')}>
          {t('recipients')}
        </NavLink>
        <NavLink to="/app/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
          {t('settings')}
        </NavLink>
        <p className="muted" style={{ marginTop: '1.4rem', color: '#d7c7a8' }}>
          {user?.displayName}
        </p>
        <button
          className="linkish"
          style={{ background: 'transparent', border: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}
          onClick={() => {
            logout()
            navigate('/')
          }}
        >
          {t('logout')}
        </button>
      </aside>
      <div className="main">
        <div className="topbar">
          <div className="muted">{t('tagline')}</div>
          <button className="lang-toggle" onClick={toggle} type="button">
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
        <Outlet />
      </div>
      <nav className="bottom-nav">
        <NavLink to="/app" end>
          {t('overview')}
        </NavLink>
        <NavLink to="/app/items">{t('ledger')}</NavLink>
        <NavLink to="/app/recipients">{t('recipients')}</NavLink>
        <NavLink to="/app/settings">{t('settings')}</NavLink>
      </nav>
    </div>
  )
}
