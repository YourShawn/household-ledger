import type {
  Dashboard,
  EncryptedItem,
  ItemKind,
  Notice,
  PublicShare,
  Recipient,
  ShareMeta,
  SharingTier,
  User,
} from './types'

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

const base = import.meta.env.VITE_API_BASE ?? ''

let token = localStorage.getItem('hl.token') ?? ''

export function setToken(value: string) {
  token = value
  if (value) localStorage.setItem('hl.token', value)
  else localStorage.removeItem('hl.token')
}

export function getToken() {
  return token
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${base}${path}`, { ...init, headers })
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) {
    throw new ApiError(data.code ?? 'ERROR', data.message ?? res.statusText, res.status)
  }
  return data as T
}

export const api = {
  health: () => request<{ status: string }>('/api/health'),
  register: (body: { email: string; password: string; displayName: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<User>('/api/auth/me'),
  checkIn: () => request<User>('/api/auth/check-in', { method: 'POST' }),
  settings: (body: { sharingTier?: SharingTier; checkInIntervalDays?: number }) =>
    request<User>('/api/auth/settings', { method: 'PATCH', body: JSON.stringify(body) }),
  dashboard: () => request<Dashboard>('/api/dashboard'),
  items: (kind?: ItemKind) => request<EncryptedItem[]>(kind ? `/api/items?kind=${kind}` : '/api/items'),
  item: (id: string) => request<EncryptedItem>(`/api/items/${id}`),
  createItem: (body: { kind: ItemKind; ciphertext: string; nonce: string }) =>
    request<EncryptedItem>('/api/items', { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (id: string, body: { kind: ItemKind; ciphertext: string; nonce: string }) =>
    request<EncryptedItem>(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteItem: (id: string) => request<void>(`/api/items/${id}`, { method: 'DELETE' }),
  recipients: () => request<Recipient[]>('/api/recipients'),
  addRecipient: (body: { name: string; email: string; relationship?: string }) =>
    request<Recipient>('/api/recipients', { method: 'POST', body: JSON.stringify(body) }),
  deleteRecipient: (id: string) => request<void>(`/api/recipients/${id}`, { method: 'DELETE' }),
  shares: () => request<ShareMeta[]>('/api/shares'),
  createShare: (body: { ciphertext: string; nonce: string; kdfSalt: string }) =>
    request<ShareMeta>('/api/shares', { method: 'POST', body: JSON.stringify(body) }),
  publicShare: (token: string) => request<PublicShare>(`/api/shares/${token}`),
  arm: (body: { ciphertext: string; nonce: string; kdfSalt: string }) =>
    request<ShareMeta>('/api/auto-send/arm', { method: 'POST', body: JSON.stringify(body) }),
  disarm: () => request<{ armed: boolean }>('/api/auto-send/disarm', { method: 'POST' }),
  notices: () => request<Notice[]>('/api/notices'),
}
