export type ItemKind =
  | 'ASSET'
  | 'CARD'
  | 'MONEY'
  | 'DEBT'
  | 'INSURANCE'
  | 'KEY'
  | 'ACCOUNT_HINT'
  | 'FILE_LOCATION'

export type SharingTier = 'RECORD_ONLY' | 'MANUAL_SHARE' | 'AUTO_SEND'

export type FieldDef = {
  key: string
  zh: string
  en: string
  hintZh?: string
  hintEn?: string
  multiline?: boolean
}

export type KindMeta = {
  id: ItemKind
  zh: string
  en: string
  glyph: string
  fields: FieldDef[]
}

export const KINDS: KindMeta[] = [
  {
    id: 'ASSET',
    zh: '物资',
    en: 'Goods',
    glyph: '物',
    fields: [
      { key: 'name', zh: '名称', en: 'Name' },
      { key: 'location', zh: '存放位置', en: 'Where kept' },
      { key: 'quantity', zh: '数量', en: 'Quantity' },
      { key: 'notes', zh: '备注', en: 'Notes', multiline: true },
    ],
  },
  {
    id: 'CARD',
    zh: '卡',
    en: 'Card',
    glyph: '卡',
    fields: [
      { key: 'name', zh: '卡名', en: 'Label' },
      { key: 'issuer', zh: '发卡方', en: 'Issuer' },
      { key: 'last4', zh: '末四位提示', en: 'Last-4 hint', hintZh: '不要写完整卡号', hintEn: 'Never store a full PAN' },
      { key: 'expiryHint', zh: '有效期提示', en: 'Expiry hint' },
      { key: 'whereKept', zh: '存放处', en: 'Where kept' },
    ],
  },
  {
    id: 'MONEY',
    zh: '钱',
    en: 'Cash',
    glyph: '钱',
    fields: [
      { key: 'name', zh: '名称', en: 'Name' },
      { key: 'amountHint', zh: '金额提示', en: 'Amount hint', hintZh: '可写约数，非银行接口', hintEn: 'A hint only — no bank API' },
      { key: 'currency', zh: '币种', en: 'Currency' },
      { key: 'whereKept', zh: '存放处', en: 'Where kept' },
    ],
  },
  {
    id: 'DEBT',
    zh: '债',
    en: 'Debt',
    glyph: '债',
    fields: [
      { key: 'name', zh: '名称', en: 'Name' },
      { key: 'counterparty', zh: '对方', en: 'Counterparty' },
      { key: 'amountHint', zh: '金额提示', en: 'Amount hint' },
      { key: 'dueHint', zh: '期限提示', en: 'Due hint' },
    ],
  },
  {
    id: 'INSURANCE',
    zh: '保险',
    en: 'Insurance',
    glyph: '保',
    fields: [
      { key: 'name', zh: '名称', en: 'Name' },
      { key: 'provider', zh: '承保方', en: 'Provider' },
      { key: 'policyHint', zh: '保单提示', en: 'Policy hint' },
      { key: 'contact', zh: '联系方式', en: 'Contact' },
    ],
  },
  {
    id: 'KEY',
    zh: '钥匙',
    en: 'Key',
    glyph: '钥',
    fields: [
      { key: 'name', zh: '名称', en: 'Name' },
      { key: 'whatItOpens', zh: '对应锁具', en: 'What it opens' },
      { key: 'whereKept', zh: '存放处', en: 'Where kept' },
    ],
  },
  {
    id: 'ACCOUNT_HINT',
    zh: '账号提示',
    en: 'Account hint',
    glyph: '号',
    fields: [
      { key: 'name', zh: '名称', en: 'Name' },
      { key: 'service', zh: '服务', en: 'Service' },
      { key: 'usernameHint', zh: '用户名提示', en: 'Username hint' },
      { key: 'recoveryHint', zh: '找回提示', en: 'Recovery hint', hintZh: '不要写真实密码', hintEn: 'Do not store real passwords' },
    ],
  },
  {
    id: 'FILE_LOCATION',
    zh: '文件位置',
    en: 'File location',
    glyph: '档',
    fields: [
      { key: 'name', zh: '名称', en: 'Name' },
      { key: 'description', zh: '说明', en: 'Description', multiline: true },
      { key: 'whereKept', zh: '存放处', en: 'Where kept' },
    ],
  },
]

export function kindMeta(id: ItemKind): KindMeta {
  return KINDS.find((k) => k.id === id) ?? KINDS[0]
}

export type User = {
  id: string
  email: string
  displayName: string
  sharingTier: SharingTier
  lastCheckInAt: string
  checkInIntervalDays: number
  autoSendArmed: boolean
  autoSendTriggeredAt: string | null
  cryptoSalt: string
  autoBundlePresent: boolean
  createdAt: string
}

export type EncryptedItem = {
  id: string
  kind: ItemKind
  ciphertext: string
  nonce: string
  createdAt: string
  updatedAt: string
}

export type Recipient = {
  id: string
  name: string
  email: string
  relationship: string | null
  createdAt: string
}

export type ShareMeta = {
  id: string | null
  shareKind: 'MANUAL' | 'AUTO'
  expiresAt: string | null
  createdAt: string
  retrievePath: string | null
}

export type PublicShare = {
  id: string
  shareKind: 'MANUAL' | 'AUTO'
  kdfSalt: string
  ciphertext: string
  nonce: string
  expiresAt: string | null
  createdAt: string
}

export type Notice = {
  id: string
  recipientName: string
  recipientEmail: string
  channel: string
  status: string
  detail: string | null
  createdAt: string
}

export type Dashboard = {
  itemCount: number
  recipientCount: number
  sharingTier: SharingTier
  lastCheckInAt: string
  checkInIntervalDays: number
  autoSendArmed: boolean
  autoSendTriggeredAt: string | null
  byKind: { kind: ItemKind; count: number }[]
}

export const SAMPLE_ITEMS: { kind: ItemKind; payload: Record<string, string> }[] = [
  { kind: 'ASSET', payload: { name: '户口本', location: '书房抽屉左侧', quantity: '1', notes: '红色封皮' } },
  { kind: 'KEY', payload: { name: '备用大门钥匙', whatItOpens: '单元门+入户门', whereKept: '鞋柜上层铁盒' } },
  { kind: 'FILE_LOCATION', payload: { name: '房产证', description: '不动产权证书', whereKept: '书房保险柜第二层' } },
  { kind: 'ACCOUNT_HINT', payload: { name: '家庭邮箱', service: '邮箱', usernameHint: 'family@example.invalid', recoveryHint: '提示写在纸质笔记本封面内页' } },
]
