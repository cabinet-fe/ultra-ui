import type { DataConnection } from '@veltra/sheet'

/** 工作区数据集（SQL 与连接凭据仅存服务端） */
export interface WorkspaceDataset {
  id: string
  connectionId: string
  label: string
  sql: string
  paramOverrides?: Record<string, unknown>
  fieldOverrides?: Record<string, unknown>
}

export interface WorkspaceData {
  connections: DataConnection[]
  datasets: WorkspaceDataset[]
}
