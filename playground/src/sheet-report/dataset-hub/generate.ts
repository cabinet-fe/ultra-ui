import type { DatasetRecords } from '../types'
import type { DatasetSeeds } from './seeds'
import { DEFAULT_SEEDS } from './seeds'
import type { DatasetQueryParam, DatasetQueryParamValues } from './types'

function asString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }
  return ''
}

function asNumber(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function inDateRange(dateStr: unknown, from: string, to: string): boolean {
  const date = asString(dateStr)
  if (!date) return false
  return date >= from && date <= to
}

function filterOrders(
  rows: Record<string, unknown>[],
  params: DatasetQueryParamValues
): Record<string, unknown>[] {
  const from = asString(params.dateFrom)
  const to = asString(params.dateTo)
  const region = asString(params.region)

  return rows.filter((row) => {
    if (from && to && !inDateRange(row.orderDate, from, to)) return false
    if (region && row.region !== region) return false
    return true
  })
}

function filterPayments(
  rows: Record<string, unknown>[],
  orderNos: Set<string>,
  params: DatasetQueryParamValues
): Record<string, unknown>[] {
  const from = asString(params.dateFrom)
  const to = asString(params.dateTo)

  return rows.filter((row) => {
    if (from && to && !inDateRange(row.payDate, from, to)) return false
    if (orderNos.size > 0 && !orderNos.has(asString(row.orderNo))) return false
    return true
  })
}

function filterCustomers(
  rows: Record<string, unknown>[],
  params: DatasetQueryParamValues
): Record<string, unknown>[] {
  const region = asString(params.region)
  if (!region) return rows
  return rows.filter((row) => row.region === region)
}

function filterInventoryAlerts(
  rows: Record<string, unknown>[],
  params: DatasetQueryParamValues
): Record<string, unknown>[] {
  const threshold = asNumber(params.alertThreshold, 80)
  return rows.filter((row) => asNumber(row.stock, 0) <= threshold)
}

function filterSalesMatrix(
  rows: Record<string, unknown>[],
  params: DatasetQueryParamValues
): Record<string, unknown>[] {
  const region = asString(params.region)
  if (!region) return rows
  return rows.filter((row) => row.region === region)
}

/** 根据查询参数从种子数据生成 DatasetRecords */
export function generateRecords(
  params: DatasetQueryParamValues,
  seeds: DatasetSeeds = DEFAULT_SEEDS
): DatasetRecords {
  const orders = filterOrders(seeds.orders, params)
  const orderNos = new Set(orders.map((row) => asString(row.orderNo)))

  return {
    orders,
    customers: filterCustomers(seeds.customers, params),
    products: seeds.products,
    employees: seeds.employees,
    payments: filterPayments(seeds.payments, orderNos, params),
    'inventory-alerts': filterInventoryAlerts(seeds.inventoryAlerts, params),
    'sales-matrix': filterSalesMatrix(seeds.salesMatrix, params)
  }
}

/** 从参数定义生成默认值 */
export function createDefaultParamValues(params: DatasetQueryParam[]): DatasetQueryParamValues {
  const values: DatasetQueryParamValues = {}
  for (const param of params) {
    values[param.id] = param.defaultValue
  }
  return values
}
