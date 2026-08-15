import type { ReportTemplate } from '@veltra/sheet'
import { describe, expect, it } from 'vitest'

import {
  LAST_TEMPLATE_ID_KEY,
  readLastTemplateId,
  resolveStartupTemplate,
  writeLastTemplateId
} from './startup'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial))
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.get(key) ?? null
    },
    key(index: number) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(key, value)
    }
  }
}

const seedTemplate = {
  version: 1,
  cells: [],
  styles: [],
  merges: [],
  frozen: { rows: 0, cols: 0 },
  rows: 24,
  cols: 10,
  datasets: [{ id: 'ds-1', label: '订单', sql: 'SELECT 1', connection: {} }]
} as unknown as ReportTemplate

const namedTemplate = {
  version: 1,
  cells: [{ row: 0, col: 0, v: '已保存模板' }],
  styles: [],
  merges: [],
  frozen: { rows: 0, cols: 0 },
  rows: 24,
  cols: 10
} as ReportTemplate

describe('sheet-report startup 模板恢复', () => {
  it('readLastTemplateId 忽略空串', () => {
    expect(readLastTemplateId(memoryStorage())).toBeNull()
    expect(readLastTemplateId(memoryStorage({ [LAST_TEMPLATE_ID_KEY]: '  ' }))).toBeNull()
    expect(readLastTemplateId(memoryStorage({ [LAST_TEMPLATE_ID_KEY]: 'tpl-1' }))).toBe('tpl-1')
  })

  it('writeLastTemplateId 写入与清除', () => {
    const storage = memoryStorage()
    writeLastTemplateId(storage, 'tpl-2')
    expect(storage.getItem(LAST_TEMPLATE_ID_KEY)).toBe('tpl-2')
    writeLastTemplateId(storage, null)
    expect(storage.getItem(LAST_TEMPLATE_ID_KEY)).toBeNull()
  })

  it('有 lastTemplateId 且命名模板拉取成功时优先恢复该模板', () => {
    const result = resolveStartupTemplate({
      lastTemplateId: 'tpl-1',
      namedTemplate: { id: 'tpl-1', name: '销售月报', template: namedTemplate },
      seedTemplate
    })
    expect(result).toEqual({
      source: 'named',
      template: namedTemplate,
      activeTemplateId: 'tpl-1',
      templateName: '销售月报'
    })
  })

  it('有 lastTemplateId 但命名模板拉取失败时退回工作区种子模板', () => {
    const result = resolveStartupTemplate({
      lastTemplateId: 'tpl-missing',
      namedTemplate: null,
      seedTemplate
    })
    expect(result).toEqual({
      source: 'seed',
      template: seedTemplate,
      activeTemplateId: null,
      templateName: '未命名模板'
    })
  })

  it('无 lastTemplateId 时使用工作区种子模板', () => {
    const result = resolveStartupTemplate({
      lastTemplateId: null,
      namedTemplate: null,
      seedTemplate
    })
    expect(result.source).toBe('seed')
    expect(result.template).toBe(seedTemplate)
    expect(result.activeTemplateId).toBeNull()
  })

  it('无 lastTemplateId 且工作区无数据集时为空设计态', () => {
    const result = resolveStartupTemplate({
      lastTemplateId: null,
      namedTemplate: null,
      seedTemplate: undefined
    })
    expect(result).toEqual({ source: 'empty', activeTemplateId: null, templateName: '未命名模板' })
  })
})
