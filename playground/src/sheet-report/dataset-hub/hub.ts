import type { DatasetCatalogItem, DatasetRecords } from '../types'
import { createMockDatabase, type MockDatabase } from './database'
import {
  DATASET_CATALOG,
  DEFAULT_CONNECTION,
  DEFAULT_DATASETS,
  buildCatalogFromDatasets
} from './defaults'
import { createDefaultParamValues, describeSql, executeSql, buildParamDefs } from './sql'
import type {
  DataConnection,
  DataHub,
  DataHubListener,
  DatasetDef,
  MockDataHub,
  ParamValues,
  QueryParamDef,
  SqlDescribeResult,
  SqlExecuteError
} from './types'

export interface CreateDataHubOptions {
  database?: MockDatabase
  connections?: DataConnection[]
  datasets?: DatasetDef[]
  initialParamValues?: ParamValues
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function createDataHub(options: CreateDataHubOptions = {}): DataHub {
  const db = options.database ?? createMockDatabase()
  const connections = clone(options.connections ?? [DEFAULT_CONNECTION])
  const datasets = clone(options.datasets ?? DEFAULT_DATASETS)
  const listeners = new Set<DataHubListener>()

  const allParamDefs = mergeParamDefs(datasets)
  let paramValues: ParamValues = {
    ...createDefaultParamValues(allParamDefs),
    ...options.initialParamValues
  }

  function notify(): void {
    for (const listener of listeners) {
      listener()
    }
  }

  function mergeParamDefs(source: DatasetDef[]): QueryParamDef[] {
    const map = new Map<string, QueryParamDef>()
    for (const dataset of source) {
      for (const param of buildParamDefs(dataset.sql, dataset.paramOverrides)) {
        if (!map.has(param.id)) map.set(param.id, param)
      }
    }
    return Array.from(map.values())
  }

  function describeDataset(dataset: DatasetDef): DatasetCatalogItem | undefined {
    const described = describeSql(dataset.sql, db, dataset.paramOverrides, dataset.fieldOverrides)
    if (described.error) return undefined
    return { id: dataset.id, label: dataset.label, fields: described.fields }
  }

  const hub: DataHub = {
    connections,
    datasets,
    tables: db.tables,

    subscribe(listener: DataHubListener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    getConnection(id: string) {
      return connections.find((c) => c.id === id)
    },

    addConnection(conn: DataConnection) {
      connections.push(clone(conn))
      notify()
    },

    updateConnection(id: string, patch: Partial<DataConnection>) {
      const conn = connections.find((c) => c.id === id)
      if (!conn) return
      Object.assign(conn, patch)
      notify()
    },

    removeConnection(id: string) {
      const index = connections.findIndex((c) => c.id === id)
      if (index === -1) return
      connections.splice(index, 1)
      notify()
    },

    async testConnection(id: string) {
      const conn = connections.find((c) => c.id === id)
      if (!conn) return { ok: false, message: '连接不存在' }
      await new Promise((r) => setTimeout(r, 120))
      return {
        ok: true,
        message: `已连接 ${conn.label}（${conn.host}:${conn.port}/${conn.database}）`
      }
    },

    getDataset(id: string) {
      return datasets.find((d) => d.id === id)
    },

    addDataset(dataset: DatasetDef) {
      datasets.push(clone(dataset))
      notify()
    },

    updateDataset(id: string, patch: Partial<DatasetDef>) {
      const dataset = datasets.find((d) => d.id === id)
      if (!dataset) return
      Object.assign(dataset, patch)
      notify()
    },

    removeDataset(id: string) {
      const index = datasets.findIndex((d) => d.id === id)
      if (index === -1) return
      datasets.splice(index, 1)
      notify()
    },

    describe(
      sql: string,
      paramOverrides?: DatasetDef['paramOverrides'],
      fieldOverrides?: DatasetDef['fieldOverrides']
    ): SqlDescribeResult {
      return describeSql(sql, db, paramOverrides, fieldOverrides)
    },

    query(datasetId: string, values?: ParamValues): Record<string, unknown>[] | SqlExecuteError {
      const dataset = datasets.find((d) => d.id === datasetId)
      if (!dataset) return { error: `未知数据集 ${datasetId}` }
      const result = executeSql(dataset.sql, db, values ?? paramValues)
      if ('error' in result) return result
      return result
    },

    getCatalog(): DatasetCatalogItem[] {
      const catalog = buildCatalogFromDatasets(datasets, describeDataset)
      return catalog.length > 0 ? catalog : DATASET_CATALOG
    },

    getRecords(values?: ParamValues): DatasetRecords {
      const merged = values ?? paramValues
      const records: DatasetRecords = {}
      for (const dataset of datasets) {
        const result = executeSql(dataset.sql, db, merged)
        if ('error' in result) {
          records[dataset.id] = []
          continue
        }
        records[dataset.id] = result
      }
      return records
    },

    getParamValues() {
      return { ...paramValues }
    },

    setParamValues(patch: Partial<ParamValues>) {
      paramValues = { ...paramValues, ...patch }
      notify()
    },

    resetParamValues() {
      paramValues = createDefaultParamValues(mergeParamDefs(datasets))
      notify()
    },

    getQueryParams(datasetIds?: readonly string[]) {
      if (!datasetIds || datasetIds.length === 0) {
        return mergeParamDefs(datasets)
      }
      const map = new Map<string, QueryParamDef>()
      for (const id of datasetIds) {
        const dataset = datasets.find((d) => d.id === id)
        if (!dataset) continue
        for (const param of buildParamDefs(dataset.sql, dataset.paramOverrides)) {
          if (!map.has(param.id)) map.set(param.id, param)
        }
      }
      return Array.from(map.values())
    }
  }

  return hub
}

/** @deprecated 使用 createDataHub */
export function createMockDataHub(options: CreateDataHubOptions = {}): MockDataHub {
  const hub = createDataHub(options)
  return {
    catalog: hub.getCatalog(),
    queryParams: hub.getQueryParams(),
    getParamValues: hub.getParamValues,
    setParamValues: hub.setParamValues,
    resetParamValues: hub.resetParamValues,
    getRecords: () => hub.getRecords()
  }
}

function collectQueryParams(hub: DataHub): QueryParamDef[] {
  return hub.getQueryParams()
}

/** 默认 hub 的全局查询参数（兼容旧 QUERY_PARAMS） */
export function getDefaultQueryParams(): QueryParamDef[] {
  return collectQueryParams(createDataHub())
}

export const QUERY_PARAMS: QueryParamDef[] = getDefaultQueryParams()
