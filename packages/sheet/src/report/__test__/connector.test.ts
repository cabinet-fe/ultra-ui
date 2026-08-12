import { afterEach, describe, expect, it, vi } from 'vitest'

import { createHttpConnector, resolvePortOnTypeChange } from '../connector'
import type { DataConnection } from '../connector'
import type { ParamValues } from '../types'

const CONNECTION: DataConnection = {
  id: 'demo',
  label: '演示业务库',
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  database: 'demo_business',
  username: 'demo',
  password: 'demo'
}

const SQL = 'SELECT customer, amount FROM orders WHERE region = ${region}'
const VALUES: ParamValues = { region: '华东' }

const ENDPOINT = 'https://api.example.com/report'

interface FetchCall {
  url: string
  method: string
  headers: Headers
  body: unknown
}

function stubFetch(respond: (url: string, init: RequestInit) => Promise<unknown>): FetchCall[] {
  const calls: FetchCall[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    const headers = new Headers(init?.headers)
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined
    calls.push({ url, method, headers, body })
    const payload = await respond(url, init ?? {})
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return calls
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createHttpConnector', () => {
  it('test：POST {endpoint}/test，请求体为 { connection }，成功返回 ok 且无 data', async () => {
    const calls = stubFetch(async () => ({ ok: true }))
    const connector = createHttpConnector({ endpoint: ENDPOINT })

    const result = await connector.test(CONNECTION)

    expect(result).toEqual({ ok: true, data: undefined })
    expect(calls).toHaveLength(1)
    expect(calls[0]!.url).toBe(`${ENDPOINT}/test`)
    expect(calls[0]!.method).toBe('POST')
    expect(calls[0]!.headers.get('content-type')).toBe('application/json')
    expect(calls[0]!.body).toEqual({ connection: CONNECTION })
  })

  it('describe：POST {endpoint}/describe，请求体 { connection, sql }，fields 归一化为 DatasetField', async () => {
    const calls = stubFetch(async () => ({
      ok: true,
      fields: [{ name: 'customer' }, { name: 'amount', type: 'number' }]
    }))
    const connector = createHttpConnector({ endpoint: ENDPOINT })

    const result = await connector.describe(CONNECTION, SQL)

    expect(result).toEqual({
      ok: true,
      data: [
        { name: 'customer', label: 'customer', type: 'string' },
        { name: 'amount', label: 'amount', type: 'number' }
      ]
    })
    expect(calls[0]!.url).toBe(`${ENDPOINT}/describe`)
    expect(calls[0]!.body).toEqual({ connection: CONNECTION, sql: SQL })
  })

  it('describe：服务端返回 label 时保留中文显示名', async () => {
    stubFetch(async () => ({
      ok: true,
      fields: [
        { name: 'customer', label: '客户名称', type: 'string' },
        { name: 'amount', label: '金额', type: 'number' }
      ]
    }))
    const connector = createHttpConnector({ endpoint: ENDPOINT })

    const result = await connector.describe(CONNECTION, SQL)

    expect(result).toEqual({
      ok: true,
      data: [
        { name: 'customer', label: '客户名称', type: 'string' },
        { name: 'amount', label: '金额', type: 'number' }
      ]
    })
  })

  it('query：POST {endpoint}/query，请求体 { connection, sql, values }，返回 fields + rows', async () => {
    const calls = stubFetch(async () => ({
      ok: true,
      fields: [{ name: 'customer', type: 'string' }],
      rows: [{ customer: '甲公司' }]
    }))
    const connector = createHttpConnector({ endpoint: ENDPOINT })

    const result = await connector.query(CONNECTION, SQL, VALUES)

    expect(result).toEqual({
      ok: true,
      data: {
        fields: [{ name: 'customer', label: 'customer', type: 'string' }],
        rows: [{ customer: '甲公司' }]
      }
    })
    expect(calls[0]!.url).toBe(`${ENDPOINT}/query`)
    expect(calls[0]!.body).toEqual({ connection: CONNECTION, sql: SQL, values: VALUES })
  })

  it('业务错误分叉：200 + { ok: false, error } 原样透传（三端点一致）', async () => {
    stubFetch(async () => ({
      ok: false,
      error: { code: 'CONNECTION_REFUSED', message: '无法连接到数据库' }
    }))
    const connector = createHttpConnector({ endpoint: ENDPOINT })

    const testResult = await connector.test(CONNECTION)
    expect(testResult).toEqual({
      ok: false,
      error: { code: 'CONNECTION_REFUSED', message: '无法连接到数据库' }
    })

    const describeResult = await connector.describe(CONNECTION, SQL)
    expect(describeResult).toEqual({
      ok: false,
      error: { code: 'CONNECTION_REFUSED', message: '无法连接到数据库' }
    })

    const queryResult = await connector.query(CONNECTION, SQL, VALUES)
    expect(queryResult).toEqual({
      ok: false,
      error: { code: 'CONNECTION_REFUSED', message: '无法连接到数据库' }
    })
  })

  it('传输层错误：非 2xx 折叠为 HTTP_<status> 错误结果', async () => {
    const fetchMock = vi.fn(async () => new Response('Internal Server Error', { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)
    const connector = createHttpConnector({ endpoint: ENDPOINT })

    const result = await connector.test(CONNECTION)

    expect(result).toEqual({
      ok: false,
      error: { code: 'HTTP_500', message: '请求失败（HTTP 500）' }
    })
  })

  it('网络异常：fetch reject 折叠为 NETWORK_ERROR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('fetch failed')))
    )
    const connector = createHttpConnector({ endpoint: ENDPOINT })

    const result = await connector.test(CONNECTION)

    expect(result).toEqual({ ok: false, error: { code: 'NETWORK_ERROR', message: 'fetch failed' } })
  })

  it('响应不可解析：非 JSON / 缺字段折叠为 BAD_RESPONSE', async () => {
    const notJson = vi.fn(async () => new Response('<html>oops</html>', { status: 200 }))
    vi.stubGlobal('fetch', notJson)
    const connector = createHttpConnector({ endpoint: ENDPOINT })

    const invalidJson = await connector.describe(CONNECTION, SQL)
    expect(invalidJson).toEqual({
      ok: false,
      error: { code: 'BAD_RESPONSE', message: '响应不是合法 JSON' }
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    )
    const missingFields = await connector.describe(CONNECTION, SQL)
    expect(missingFields).toEqual({
      ok: false,
      error: { code: 'BAD_RESPONSE', message: 'describe 响应缺少合法的 fields 数组' }
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true, fields: [] }), { status: 200 }))
    )
    const missingRows = await connector.query(CONNECTION, SQL, VALUES)
    expect(missingRows).toEqual({
      ok: false,
      error: { code: 'BAD_RESPONSE', message: 'query 响应缺少 rows 数组' }
    })
  })

  it('ok:false 但 error 形状非法时回退 SERVER_ERROR', async () => {
    stubFetch(async () => ({ ok: false, error: 'oops' }))
    const connector = createHttpConnector({ endpoint: ENDPOINT })

    const result = await connector.test(CONNECTION)

    expect(result).toEqual({
      ok: false,
      error: { code: 'SERVER_ERROR', message: '服务端返回未知错误' }
    })
  })
})

describe('resolvePortOnTypeChange', () => {
  it('默认端口随类型切换：MySQL 3306 ↔ PostgreSQL 5432', () => {
    expect(resolvePortOnTypeChange('mysql', 'postgresql', 3306)).toBe(5432)
    expect(resolvePortOnTypeChange('postgresql', 'mysql', 5432)).toBe(3306)
  })

  it('自定义端口不随类型切换而改变', () => {
    expect(resolvePortOnTypeChange('mysql', 'postgresql', 3307)).toBe(3307)
    expect(resolvePortOnTypeChange('postgresql', 'mysql', 5433)).toBe(5433)
  })

  it('端口为 0 时切到新类型默认端口', () => {
    expect(resolvePortOnTypeChange('mysql', 'postgresql', 0)).toBe(5432)
  })
})
