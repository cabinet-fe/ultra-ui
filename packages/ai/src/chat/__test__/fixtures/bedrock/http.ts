/**
 * Vendored from bedrock web/src/api（自包含快照，避免测试依赖仓库外绝对路径）。
 * 上游更新时同步此处；依赖面：@veltra/ai 类型 + ./http + ./types。
 */
import { storage, storageKey } from '@cat-kit/fe'
import { HTTPClient, TokenPlugin, type HTTPClientPlugin } from '@cat-kit/http'

import type { ApiEnvelope } from './types'

const ACCESS_KEY = storageKey<string>('access_token')
/** Legacy keys cleaned on set/clear (refresh is HttpOnly cookie from server). */
const LEGACY_REFRESH_KEY = storageKey<string>('refresh_token')

export function getAccessToken(): string | null {
  return storage.local.get(ACCESS_KEY)
}

export function setAccessToken(access: string): void {
  storage.local.set(ACCESS_KEY, access)
  storage.local.remove(LEGACY_REFRESH_KEY)
}

export function clearTokens(): void {
  storage.local.remove(ACCESS_KEY)
  storage.local.remove(LEGACY_REFRESH_KEY)
}

function isApiEnvelope(body: unknown): body is ApiEnvelope {
  if (body === null || typeof body !== 'object') return false
  const o = body as Record<string, unknown>
  return typeof o.code === 'number' && typeof o.message === 'string'
}

function envelopeErrorMessage(envelope: ApiEnvelope | undefined, fallback: string): string {
  const msg = envelope?.message || fallback
  return envelope?.request_id ? `${msg} [${envelope.request_id}]` : msg
}

/**
 * Unwraps Bedrock `{ code, message, data?, request_id? }` envelopes.
 * Successful calls resolve with `response.body === data`.
 * Must run after TokenPlugin so 401 refresh/retry happens first.
 */
function BedrockEnvelopePlugin(): HTTPClientPlugin {
  return {
    name: 'bedrock-envelope',
    afterRespond({ response }) {
      const { code, body } = response

      // Already unwrapped (e.g. TokenPlugin retry returned a processed response).
      if (!isApiEnvelope(body)) {
        if (code < 200 || code >= 300) {
          throw new Error(`HTTP ${code}`)
        }
        return
      }

      if (code < 200 || code >= 300) {
        throw new Error(envelopeErrorMessage(body, `HTTP ${code}`))
      }
      if (body.code !== 0) {
        throw new Error(envelopeErrorMessage(body, 'request failed'))
      }

      return { ...response, body: body.data }
    }
  }
}

const envelopePlugin = BedrockEnvelopePlugin()

/** Bare client for login/refresh (no Bearer injection). credentials so Set-Cookie / Cookie work. */
export const bareHttp = new HTTPClient('/api/v1', {
  timeout: 30_000,
  credentials: true,
  plugins: [envelopePlugin]
})

let onAuthExpired: (() => void) | null = null

export function setOnAuthExpired(cb: (() => void) | null): void {
  onAuthExpired = cb
}

function expireSession(): void {
  clearTokens()
  onAuthExpired?.()
}

/** 401 → POST /auth/refresh (cookie) → write new access_token; TokenPlugin retries the request. */
async function refreshAccessToken(): Promise<void> {
  try {
    const { body } = await bareHttp.post<{ access_token: string }>('/auth/refresh', {})
    if (!body?.access_token) {
      throw new Error('refresh failed')
    }
    setAccessToken(body.access_token)
  } catch (err) {
    expireSession()
    throw err
  }
}

export const http = new HTTPClient('/api/v1', {
  timeout: 30_000,
  credentials: true,
  plugins: [
    TokenPlugin({
      getter: () => getAccessToken(),
      authType: 'Bearer',
      maxRetries: 1,
      onRefresh: refreshAccessToken,
      shouldRefresh: (response) => response.code === 401
    }),
    envelopePlugin
  ]
})
