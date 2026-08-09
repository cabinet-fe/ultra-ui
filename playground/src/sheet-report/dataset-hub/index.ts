import type { DatasetRecords } from '../types'
import { createMockDatabase } from './database'
import {
  CUSTOMERS_DATASET,
  DATASET_CATALOG,
  DEFAULT_CONNECTION,
  DEFAULT_DATASETS,
  DEFAULT_SELECTED_DATASET_IDS,
  EMPLOYEES_DATASET,
  INVENTORY_ALERTS_DATASET,
  ORDERS_DATASET,
  PAYMENTS_DATASET,
  PRODUCTS_DATASET,
  SALES_MATRIX_DATASET
} from './defaults'
import { createDataHub, createMockDataHub, QUERY_PARAMS, type CreateDataHubOptions } from './hub'
import { DEFAULT_SEEDS } from './seeds'
import { createDefaultParamValues, executeSql, parseSql, extractParamIds } from './sql'

export interface CreateMockDataHubOptions extends CreateDataHubOptions {}

const defaultHub = createDataHub()

/** 默认参数下的全量 Records（兼容旧 MOCK_DATA_RECORDS） */
export const DEFAULT_DATASET_RECORDS: DatasetRecords = defaultHub.getRecords()

/** @deprecated 使用 executeSql + createDataHub */
export function generateRecords(
  params: Record<string, unknown>,
  _seeds = DEFAULT_SEEDS
): DatasetRecords {
  const hub = createDataHub()
  hub.setParamValues(params)
  return hub.getRecords()
}

export {
  CUSTOMERS_DATASET,
  DATASET_CATALOG,
  DEFAULT_CONNECTION,
  DEFAULT_DATASETS,
  DEFAULT_SELECTED_DATASET_IDS,
  EMPLOYEES_DATASET,
  INVENTORY_ALERTS_DATASET,
  ORDERS_DATASET,
  PAYMENTS_DATASET,
  PRODUCTS_DATASET,
  QUERY_PARAMS,
  SALES_MATRIX_DATASET,
  createDataHub,
  createDefaultParamValues,
  createMockDataHub,
  createMockDatabase,
  executeSql,
  extractParamIds,
  parseSql
}

export type {
  DataConnection,
  DataHub,
  DatasetDef,
  DatasetQueryParam,
  DatasetQueryParamOption,
  DatasetQueryParamType,
  DatasetQueryParamValues,
  MockDataHub,
  ParamValues,
  QueryParamDef,
  QueryParamOption,
  QueryParamType,
  TableColumn,
  TableSchema
} from './types'
