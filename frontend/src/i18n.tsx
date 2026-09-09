import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'zh' | 'en'

const dict = {
  appName: { zh: '物资家底账本', en: 'Household Ledger' },
  tagline: { zh: '记清家底。加密账本，分享随你。', en: 'Private wealth inventory. Encrypted ledger. Share on your terms.' },
  capability: {
    zh: '浏览器内加密，服务器只存密文。不连接银行。',
    en: 'Encrypted in the browser. Ciphertext on the server. No bank API.',
  },
  login: { zh: '登录', en: 'Sign in' },
  register: { zh: '开账', en: 'Create ledger' },
  email: { zh: '邮箱', en: 'Email' },
  password: { zh: '登录密码', en: 'Login password' },
  displayName: { zh: '称呼', en: 'Display name' },
  unlock: { zh: '打开账本', en: 'Unlock' },
  lock: { zh: '合上', en: 'Lock' },
  logout: { zh: '退出', en: 'Sign out' },
  overview: { zh: '总览', en: 'Overview' },
  ledger: { zh: '账本', en: 'Ledger' },
  recipients: { zh: '接收人', en: 'Recipients' },
  settings: { zh: '设置', en: 'Settings' },
  checkIn: { zh: '报到', en: 'Check in' },
  addItem: { zh: '新记一笔', en: 'New entry' },
  save: { zh: '保存', en: 'Save' },
  delete: { zh: '删除', en: 'Delete' },
  cancel: { zh: '取消', en: 'Cancel' },
  optional: { zh: '可选', en: 'Optional' },
  tier1: { zh: '只记不发', en: 'Record only' },
  tier2: { zh: '记 + 手动分享', en: 'Record + manual share' },
  tier3: { zh: '记 + 指定人 + 逾期自动发', en: 'Record + designated + auto-send' },
  samples: { zh: '写入示例（本地加密）', en: 'Add encrypted samples' },
  demoHint: {
    zh: '演示账号 demo@household-ledger.local / DemoPass123!（保险柜自动用登录密码）',
    en: 'Demo: demo@household-ledger.local / DemoPass123! — vault auto-uses the login password',
  },
} as const

type Key = keyof typeof dict

type Ctx = { lang: Lang; t: (key: Key) => string; toggle: () => void; setLang: (l: Lang) => void }

const I18nContext = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('hl.lang') as Lang) || 'zh')
  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (l) => {
        localStorage.setItem('hl.lang', l)
        setLang(l)
      },
      toggle: () => {
        const next = lang === 'zh' ? 'en' : 'zh'
        localStorage.setItem('hl.lang', next)
        setLang(next)
      },
      t: (key) => dict[key][lang],
    }),
    [lang],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('I18nProvider missing')
  return ctx
}

export function fieldLabel(zh: string, en: string, lang: Lang) {
  return lang === 'zh' ? zh : en
}
