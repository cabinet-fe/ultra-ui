import type { DatasetRecords } from '../types'
import {
  DATASET_CATALOG,
  DEFAULT_SELECTED_DATASET_IDS,
  CUSTOMERS_DATASET,
  EMPLOYEES_DATASET,
  INVENTORY_ALERTS_DATASET,
  ORDERS_DATASET,
  PAYMENTS_DATASET,
  PRODUCTS_DATASET,
  SALES_MATRIX_DATASET
} from './catalog'
import { createDefaultParamValues, generateRecords } from './generate'
import { QUERY_PARAMS } from './params'
import type { DatasetSeeds } from './seeds'
import { DEFAULT_SEEDS } from './seeds'
import type { DatasetQueryParam, DatasetQueryParamValues, MockDataHub } from './types'

export interface CreateMockDataHubOptions {
  seeds?: DatasetSeeds
  queryParams?: DatasetQueryParam[]
  initialParamValues?: DatasetQueryParamValues
}

/** 创建 Mock Data Hub 实例 */
export function createMockDataHub(options: CreateMockDataHubOptions = {}): MockDataHub {
  const seeds = options.seeds ?? DEFAULT_SEEDS
  const queryParams = options.queryParams ?? QUERY_PARAMS
  let paramValues: DatasetQueryParamValues = {
    ...createDefaultParamValues(queryParams),
    ...options.initialParamValues
  }

  return {
    catalog: DATASET_CATALOG,
    queryParams,
    getParamValues() {
      return { ...paramValues }
    },
    setParamValues(patch) {
      paramValues = { ...paramValues, ...patch }
    },
    resetParamValues() {
      paramValues = createDefaultParamValues(queryParams)
    },
    getRecords() {
      return generateRecords(paramValues, seeds)
    }
  }
}

/** 默认参数下的全量 Records（兼容旧 MOCK_DATA_RECORDS） */
export const DEFAULT_DATASET_RECORDS: DatasetRecords = generateRecords(
  createDefaultParamValues(QUERY_PARAMS)
)

export {
  DATASET_CATALOG,
  DEFAULT_SELECTED_DATASET_IDS,
  CUSTOMERS_DATASET,
  EMPLOYEES_DATASET,
  INVENTORY_ALERTS_DATASET,
  ORDERS_DATASET,
  PAYMENTS_DATASET,
  PRODUCTS_DATASET,
  QUERY_PARAMS,
  SALES_MATRIX_DATASET,
  createDefaultParamValues,
  generateRecords
}

export type {
  DatasetQueryParam,
  DatasetQueryParamOption,
  DatasetQueryParamType,
  DatasetQueryParamValues,
  MockDataHub
} from './types'
