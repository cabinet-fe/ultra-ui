import type { Hono } from 'hono'
import { describe, expect, it } from 'vite-plus/test'

import { createAiDbApp } from './ai-db'

const JSON_HEADERS = { 'content-type': 'application/json' }

function post(app: Hono, path: string, body: unknown): Promise<Response> {
  return app.request(path, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body) })
}

function put(app: Hono, path: string, body: unknown): Promise<Response> {
  return app.request(path, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(body) })
}

function del(app: Hono, path: string): Promise<Response> {
  return app.request(path, { method: 'DELETE' })
}

const ordersTable = {
  name: 'orders',
  columns: [
    { name: 'id', type: 'number', primaryKey: true },
    { name: 'amount', type: 'number', comment: '金额' },
    { name: 'status', type: 'string' },
    { name: 'paid_at', type: 'date', nullable: true },
    { name: 'discount', type: 'number', nullable: true }
  ]
}

const customersTable = {
  name: 'customers',
  columns: [
    { name: 'id', type: 'number', primaryKey: true },
    { name: 'name', type: 'string' },
    { name: 'order_id', type: 'number', nullable: true }
  ]
}

const orderRows = {
  rows: [
    { id: 1, amount: 100, status: 'paid', paid_at: '2026-01-01' },
    { id: 2, amount: 50, status: 'paid', paid_at: null },
    { id: 3, amount: 200, status: 'pending', paid_at: null }
  ]
}

/** 建好 orders + customers 两张表（含行数据，可选） */
async function seedTables(withRows = false): Promise<Hono> {
  const app = createAiDbApp()
  expect((await post(app, '/tables', customersTable)).status).toBe(200)
  expect((await post(app, '/tables', ordersTable)).status).toBe(200)
  if (withRows) {
    expect((await post(app, '/tables/orders/rows', orderRows)).status).toBe(200)
  }
  return app
}

describe('AI 数据库内存库：初始状态', () => {
  it('全新实例 /tables 与 /relationships 均返回空集合', async () => {
    const app = createAiDbApp()

    const tables = await app.request('/tables')
    expect(tables.status).toBe(200)
    expect(await tables.json()).toEqual({ ok: true, tables: [] })

    const relationships = await app.request('/relationships')
    expect(relationships.status).toBe(200)
    expect(await relationships.json()).toEqual({ ok: true, relationships: [] })
  })
})

describe('表增删改查与校验', () => {
  it('POST /tables 新建表，GET /tables 返回列定义（默认值字段被归一化省略）', async () => {
    const app = createAiDbApp()

    const created = await post(app, '/tables', {
      name: 'users',
      columns: [
        { name: 'id', type: 'number', primaryKey: true },
        { name: 'email', type: 'string', primaryKey: false, nullable: false, comment: '' },
        { name: 'age', type: 'number', nullable: true }
      ]
    })
    expect(created.status).toBe(200)
    expect(await created.json()).toEqual({
      ok: true,
      table: {
        name: 'users',
        columns: [
          { name: 'id', type: 'number', primaryKey: true },
          { name: 'email', type: 'string' },
          { name: 'age', type: 'number', nullable: true }
        ]
      }
    })

    const listed = await app.request('/tables')
    expect(await listed.json()).toEqual({
      ok: true,
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'number', primaryKey: true },
            { name: 'email', type: 'string' },
            { name: 'age', type: 'number', nullable: true }
          ]
        }
      ]
    })
  })

  it('非法形状回 400：重复表名 / 列类型枚举外 / 双主键 / 主键可空 / 空列数组 / 非对象体', async () => {
    const app = await seedTables()

    expect((await post(app, '/tables', ordersTable)).status).toBe(400)
    expect(
      (await post(app, '/tables', { name: 't1', columns: [{ name: 'a', type: 'text' }] })).status
    ).toBe(400)
    expect(
      (
        await post(app, '/tables', {
          name: 't1',
          columns: [
            { name: 'a', type: 'number', primaryKey: true },
            { name: 'b', type: 'number', primaryKey: true }
          ]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await post(app, '/tables', {
          name: 't1',
          columns: [{ name: 'a', type: 'number', primaryKey: true, nullable: true }]
        })
      ).status
    ).toBe(400)
    expect((await post(app, '/tables', { name: 't1', columns: [] })).status).toBe(400)
    expect((await post(app, '/tables', [1, 2])).status).toBe(400)
  })

  it('PUT /tables/:name 更新列定义；body.name 不同即改名并级联更新关系引用', async () => {
    const app = await seedTables()
    await put(app, '/relationships', {
      relationships: [
        {
          type: '1-n',
          from: { table: 'orders', column: 'id' },
          to: { table: 'customers', column: 'order_id' }
        }
      ]
    })

    // 改列：orders 去掉 status，改名列不变
    const renamed = { ...ordersTable, name: 'order', columns: ordersTable.columns.slice(0, 4) }
    const updated = await put(app, '/tables/orders', renamed)
    expect(updated.status).toBe(200)
    const body = (await updated.json()) as { ok: boolean; prunedRelationships: number }
    expect(body.ok).toBe(true)
    expect(body.prunedRelationships).toBe(0)

    const tables = ((await (await app.request('/tables')).json()) as { tables: { name: string }[] })
      .tables
    expect(tables.map((table) => table.name).sort()).toEqual(['customers', 'order'])

    const relationships = (
      (await (await app.request('/relationships')).json()) as {
        relationships: {
          from: { table: string; column: string }
          to: { table: string; column: string }
        }[]
      }
    ).relationships
    expect(relationships).toHaveLength(1)
    expect(relationships[0].from).toEqual({ table: 'order', column: 'id' })
    expect(relationships[0].to).toEqual({ table: 'customers', column: 'order_id' })
  })

  it('PUT 改名撞已有表名 / 更新不存在表 / DELETE 不存在表分别回 400 / 404 / 404', async () => {
    const app = await seedTables()

    expect((await put(app, '/tables/orders', { ...ordersTable, name: 'customers' })).status).toBe(
      400
    )
    expect((await put(app, '/tables/missing', ordersTable)).status).toBe(404)
    expect((await del(app, '/tables/missing')).status).toBe(404)
  })

  it('更新表删除被关系引用的列时剪除该关系；删除表连带行数据与引用它的关系', async () => {
    const app = await seedTables(true)
    await put(app, '/relationships', {
      relationships: [
        {
          type: '1-n',
          from: { table: 'orders', column: 'id' },
          to: { table: 'customers', column: 'order_id' }
        },
        {
          type: '1-n',
          from: { table: 'orders', column: 'status' },
          to: { table: 'customers', column: 'id' }
        }
      ]
    })

    // 去掉 status 列：引用 orders.status 的关系被剪除
    const withoutStatus = {
      ...ordersTable,
      columns: ordersTable.columns.filter((column) => column.name !== 'status')
    }
    const updated = await put(app, '/tables/orders', withoutStatus)
    expect(((await updated.json()) as { prunedRelationships: number }).prunedRelationships).toBe(1)

    // 行数据随列删除收缩：status 的值被裁掉，行本身保留
    const rowsBody = (await (await app.request('/tables/orders/rows')).json()) as {
      rows: Record<string, unknown>[]
      total: number
    }
    expect(rowsBody.total).toBe(3)
    expect(rowsBody.rows.every((row) => !('status' in row))).toBe(true)

    // 删除 orders：剩余关系（customers.order_id → orders.id）一并删除
    const removed = await del(app, '/tables/orders')
    expect(((await removed.json()) as { removedRelationships: number }).removedRelationships).toBe(
      1
    )
    expect((await app.request('/tables/orders/rows')).status).toBe(404)
  })
})

describe('关系读写与引用约束', () => {
  it('PUT /relationships 引用不存在的表 / 列、类型枚举外、重复关系均回 400', async () => {
    const app = await seedTables()

    expect(
      (
        await put(app, '/relationships', {
          relationships: [
            {
              type: '1-n',
              from: { table: 'nope', column: 'id' },
              to: { table: 'orders', column: 'id' }
            }
          ]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await put(app, '/relationships', {
          relationships: [
            {
              type: '1-n',
              from: { table: 'orders', column: 'nope' },
              to: { table: 'orders', column: 'id' }
            }
          ]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await put(app, '/relationships', {
          relationships: [
            {
              type: 'n-1',
              from: { table: 'orders', column: 'id' },
              to: { table: 'orders', column: 'id' }
            }
          ]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await put(app, '/relationships', {
          relationships: [
            {
              type: '1-n',
              from: { table: 'orders', column: 'id' },
              to: { table: 'orders', column: 'id' }
            },
            {
              type: '1-n',
              from: { table: 'orders', column: 'id' },
              to: { table: 'orders', column: 'id' }
            }
          ]
        })
      ).status
    ).toBe(400)
    expect((await put(app, '/relationships', {})).status).toBe(400)
  })

  it('PUT /relationships 全量覆盖，三种关系类型均可写入并可读回', async () => {
    const app = await seedTables()

    const relationships = [
      {
        type: '1-1',
        from: { table: 'orders', column: 'id' },
        to: { table: 'customers', column: 'order_id' }
      },
      {
        type: '1-n',
        from: { table: 'customers', column: 'id' },
        to: { table: 'orders', column: 'id' }
      },
      {
        type: 'n-n',
        from: { table: 'orders', column: 'id' },
        to: { table: 'orders', column: 'id' }
      }
    ]
    const saved = await put(app, '/relationships', { relationships })
    expect(saved.status).toBe(200)
    expect(await saved.json()).toEqual({ ok: true, relationships })

    // 全量覆盖为空集
    await put(app, '/relationships', { relationships: [] })
    expect(await (await app.request('/relationships')).json()).toEqual({
      ok: true,
      relationships: []
    })
  })
})

describe('行数据写入与过滤查询', () => {
  it('POST rows 批量写入，GET rows 返回全量行', async () => {
    const app = await seedTables()

    const inserted = await post(app, '/tables/orders/rows', orderRows)
    expect(inserted.status).toBe(200)
    expect(await inserted.json()).toEqual({ ok: true, inserted: 3, total: 3 })

    const queried = await app.request('/tables/orders/rows')
    expect(await queried.json()).toEqual({ ok: true, rows: orderRows.rows, total: 3 })
  })

  it('非法行数据回 400：未知列 / 类型不符 / 不可空列缺值或为空 / 主键重复 / 日期格式错', async () => {
    const app = await seedTables(true)

    expect((await post(app, '/tables/orders/rows', { rows: [{ id: 9, nope: 1 }] })).status).toBe(
      400
    )
    expect(
      (await post(app, '/tables/orders/rows', { rows: [{ id: '9', amount: 1, status: 'x' }] }))
        .status
    ).toBe(400)
    expect(
      (await post(app, '/tables/orders/rows', { rows: [{ amount: 1, status: 'x' }] })).status
    ).toBe(400)
    expect(
      (await post(app, '/tables/orders/rows', { rows: [{ id: null, amount: 1, status: 'x' }] }))
        .status
    ).toBe(400)
    // 与已存主键 id=1 冲突
    expect(
      (await post(app, '/tables/orders/rows', { rows: [{ id: 1, amount: 1, status: 'x' }] })).status
    ).toBe(400)
    // 批内主键重复
    expect(
      (
        await post(app, '/tables/orders/rows', {
          rows: [
            { id: 10, amount: 1, status: 'x' },
            { id: 10, amount: 2, status: 'x' }
          ]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await post(app, '/tables/orders/rows', {
          rows: [{ id: 11, amount: 1, status: 'x', paid_at: '2026/01/01' }]
        })
      ).status
    ).toBe(400)
    expect((await post(app, '/tables/orders/rows', { rows: [] })).status).toBe(400)
  })

  it('不存在的表写入 / 查询行数据回 404', async () => {
    const app = createAiDbApp()
    expect((await post(app, '/tables/missing/rows', { rows: [{ id: 1 }] })).status).toBe(404)
    expect((await app.request('/tables/missing/rows')).status).toBe(404)
  })

  it('GET rows?filter 等值过滤：标量精确匹配，null 匹配空值（null 或缺键）', async () => {
    const app = await seedTables(true)

    const byStatus = await app.request(
      `/tables/orders/rows?filter=${encodeURIComponent(JSON.stringify({ status: 'paid' }))}`
    )
    expect(await byStatus.json()).toEqual({
      ok: true,
      rows: [orderRows.rows[0], orderRows.rows[1]],
      total: 2
    })

    const byNullable = await app.request(
      `/tables/orders/rows?filter=${encodeURIComponent(JSON.stringify({ discount: null }))}`
    )
    expect(((await byNullable.json()) as { total: number }).total).toBe(3)

    const byNumber = await app.request(
      `/tables/orders/rows?filter=${encodeURIComponent(JSON.stringify({ id: 2 }))}`
    )
    expect(((await byNumber.json()) as { rows: unknown[] }).rows).toHaveLength(1)
  })

  it('filter 引用不存在的列 / 非 JSON / 类型不符回 400', async () => {
    const app = await seedTables(true)

    expect(
      (await app.request(`/tables/orders/rows?filter=${encodeURIComponent('{"nope":1}')}`)).status
    ).toBe(400)
    expect((await app.request('/tables/orders/rows?filter=not-json')).status).toBe(400)
    expect(
      (await app.request(`/tables/orders/rows?filter=${encodeURIComponent('{"id":"1"}')}`)).status
    ).toBe(400)
  })
})

describe('统计聚合', () => {
  it('无分组整表聚合 count / sum / avg / min / max，并返回明细行', async () => {
    const app = await seedTables(true)

    const stats = await post(app, '/stats', {
      table: 'orders',
      aggregations: [
        { func: 'count' },
        { func: 'sum', column: 'amount' },
        { func: 'avg', column: 'amount' },
        { func: 'min', column: 'amount' },
        { func: 'max', column: 'amount' }
      ]
    })
    expect(stats.status).toBe(200)
    const body = (await stats.json()) as {
      groups: {
        key: Record<string, unknown>
        count: number
        values: Record<string, number | null>
      }[]
      rows: unknown[]
    }
    expect(body.groups).toHaveLength(1)
    expect(body.groups[0].key).toEqual({})
    expect(body.groups[0].count).toBe(3)
    expect(body.groups[0].values['count']).toBe(3)
    expect(body.groups[0].values['sum__amount']).toBe(350)
    expect(body.groups[0].values['avg__amount']).toBeCloseTo(350 / 3, 8)
    expect(body.groups[0].values['min__amount']).toBe(50)
    expect(body.groups[0].values['max__amount']).toBe(200)
    expect(body.rows).toHaveLength(3)
  })

  it('过滤 + 分组维度：按 status 聚合并只返回命中过滤的明细行', async () => {
    const app = await seedTables(true)

    const stats = await post(app, '/stats', {
      table: 'orders',
      filter: { status: 'paid' },
      groupBy: ['status'],
      aggregations: [
        { func: 'count' },
        { func: 'sum', column: 'amount' },
        { func: 'min', column: 'amount' }
      ]
    })
    const body = (await stats.json()) as {
      groups: {
        key: Record<string, unknown>
        count: number
        values: Record<string, number | null>
      }[]
      rows: unknown[]
    }
    expect(body.groups).toEqual([
      { key: { status: 'paid' }, count: 2, values: { count: 2, sum__amount: 150, min__amount: 50 } }
    ])
    expect(body.rows).toEqual([orderRows.rows[0], orderRows.rows[1]])
  })

  it('全空数值列的 sum / avg / min / max 为 null，分组键缺失可空列按 null 归组', async () => {
    const app = await seedTables(true)

    const stats = await post(app, '/stats', {
      table: 'orders',
      groupBy: ['discount'],
      aggregations: [
        { func: 'sum', column: 'discount' },
        { func: 'avg', column: 'discount' },
        { func: 'min', column: 'discount' },
        { func: 'max', column: 'discount' }
      ]
    })
    const body = (await stats.json()) as {
      groups: {
        key: Record<string, unknown>
        count: number
        values: Record<string, number | null>
      }[]
    }
    expect(body.groups).toEqual([
      {
        key: { discount: null },
        count: 3,
        values: {
          sum__discount: null,
          avg__discount: null,
          min__discount: null,
          max__discount: null
        }
      }
    ])
  })

  it('非法统计请求回 400：表不存在 / 空 aggregations / 非 number 列聚合 / 未知分组维度 / 未知过滤列', async () => {
    const app = await seedTables(true)

    expect(
      (await post(app, '/stats', { table: 'missing', aggregations: [{ func: 'count' }] })).status
    ).toBe(400)
    expect((await post(app, '/stats', { table: 'orders', aggregations: [] })).status).toBe(400)
    expect(
      (
        await post(app, '/stats', {
          table: 'orders',
          aggregations: [{ func: 'sum', column: 'status' }]
        })
      ).status
    ).toBe(400)
    expect(
      (await post(app, '/stats', { table: 'orders', aggregations: [{ func: 'sum' }] })).status
    ).toBe(400)
    expect(
      (
        await post(app, '/stats', {
          table: 'orders',
          groupBy: ['nope'],
          aggregations: [{ func: 'count' }]
        })
      ).status
    ).toBe(400)
    expect(
      (
        await post(app, '/stats', {
          table: 'orders',
          filter: { nope: 1 },
          aggregations: [{ func: 'count' }]
        })
      ).status
    ).toBe(400)
  })
})
