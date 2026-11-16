/**
 * AI 数据库建模的 9 个对话工具，逐一映射 `/ai-db-api` REST 端点（见 api.ts）。
 * execute 全部走 api.ts，错误文案由服务端 400/404 响应透出后回灌模型自行修正。
 * 追问工具 askQuestion 由 UAiChat 内置注入，此处不重复注册。
 */
import type { ChatTool } from '@veltra/ai'
import {
  ChartPie,
  CirclePlus,
  Database,
  Delete,
  Edit,
  Link,
  List,
  Search,
  Share
} from '@veltra/icons/normal'

import {
  AGGREGATION_FUNCS,
  analyzeStats,
  COLUMN_TYPES,
  createTable,
  deleteTable,
  getRelationships,
  getTables,
  insertRows,
  queryRows,
  RELATIONSHIP_TYPES,
  replaceRelationships,
  updateTable,
  type RelationshipDef,
  type RowData,
  type RowValue,
  type StatsQuery,
  type TableDef
} from './api'

/** 列定义 JSON Schema 片段（写入表 / 更新表共用） */
const columnsSchema = {
  type: 'array',
  description: '列定义列表（至少一列，列名在表内不可重复）',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '列名' },
      type: { type: 'string', enum: [...COLUMN_TYPES], description: '列类型' },
      primaryKey: { type: 'boolean', description: '是否主键（一表至多一个，隐含非空且唯一）' },
      nullable: { type: 'boolean', description: '是否可空（默认不可空）' },
      comment: { type: 'string', description: '列备注（可选）' }
    },
    required: ['name', 'type']
  }
}

/** 表定义入参（写入表 / 更新表共用）：name + columns */
const tableSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '表名（snake_case 英文，如 user_order）' },
    columns: columnsSchema
  },
  required: ['name', 'columns']
}

export const dbTools: ChatTool[] = [
  {
    name: 'getTables',
    description:
      '获取内存数据库中的全部表（含每张表的列定义）。建模前先调用了解现状，避免重复建表。',
    label: '获取表',
    icon: List,
    parameters: { type: 'object', properties: {} },
    execute: (_args, { signal }) => getTables(signal)
  },
  {
    name: 'createTable',
    description: '新建一张表（含列定义）。表名不可与已有表重复；建模产出表结构时用本工具落库。',
    label: '写入表',
    icon: Database,
    parameters: tableSchema,
    execute: (args: TableDef, { signal }) => createTable(args, signal)
  },
  {
    name: 'updateTable',
    description:
      '更新已存在的表定义（整体替换列定义）。name 为现有表名；body 的 name 与其不同即改名（引用它的关系会级联更新）。注意：改名或删列可能剪除失效的关系。',
    label: '更新表',
    icon: Edit,
    parameters: {
      type: 'object',
      properties: { name: { type: 'string', description: '要更新的现有表名' }, table: tableSchema },
      required: ['name', 'table']
    },
    execute: (args: { name: string; table: TableDef }, { signal }) =>
      updateTable(args.name, args.table, signal)
  },
  {
    name: 'deleteTable',
    description: '删除指定表（危险操作，需用户确认；连带删除其行数据与引用它的实体关系）。',
    label: '删除表',
    icon: Delete,
    needsConfirm: true,
    parameters: {
      type: 'object',
      properties: { name: { type: 'string', description: '要删除的表名' } },
      required: ['name']
    },
    execute: (args: { name: string }, { signal }) => deleteTable(args.name, signal)
  },
  {
    name: 'insertRows',
    description:
      '向指定表批量写入行数据。每行是「列名 → 值」对象，不可空列必须给值；date 列用 YYYY-MM-DD。',
    label: '写入数据',
    icon: CirclePlus,
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: '目标表名' },
        rows: {
          type: 'array',
          description: '行数据列表（键为列名，值按列类型）',
          items: { type: 'object', description: '一行数据' }
        }
      },
      required: ['table', 'rows']
    },
    execute: (args: { table: string; rows: RowData[] }, { signal }) =>
      insertRows(args.table, args.rows, signal)
  },
  {
    name: 'queryRows',
    description:
      '查询指定表的行数据。filter 为受控等值过滤（列名 → 值，null 匹配空值），不支持模糊或范围查询；缺省返回全部行。',
    label: '查询数据',
    icon: Search,
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: '目标表名' },
        filter: { type: 'object', description: '等值过滤条件（可选，键为列名）' }
      },
      required: ['table']
    },
    execute: (args: { table: string; filter?: Record<string, RowValue> }, { signal }) =>
      queryRows(args.table, args.filter, signal)
  },
  {
    name: 'analyzeStats',
    description:
      '统计分析：对指定表按过滤条件筛选后，可按维度列分组并做聚合。聚合函数 count 可省列，sum/avg/min/max 必须指定 number 列。返回分组序列与明细行。',
    label: '统计分析',
    icon: ChartPie,
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: '目标表名' },
        filter: { type: 'object', description: '等值过滤条件（可选，键为列名）' },
        groupBy: {
          type: 'array',
          description: '分组维度列（可选，缺省整表一组）',
          items: { type: 'string' }
        },
        aggregations: {
          type: 'array',
          description: '聚合列表（至少一项）',
          items: {
            type: 'object',
            properties: {
              func: { type: 'string', enum: [...AGGREGATION_FUNCS], description: '聚合函数' },
              column: { type: 'string', description: '聚合列（count 可省略）' }
            },
            required: ['func']
          }
        }
      },
      required: ['table', 'aggregations']
    },
    execute: (args: StatsQuery, { signal }) => analyzeStats(args, signal)
  },
  {
    name: 'getRelationships',
    description: '获取全部实体关系（表与表之间的一对一 / 一对多 / 多对多关联）。',
    label: '获取实体关系',
    icon: Link,
    parameters: { type: 'object', properties: {} },
    execute: (_args, { signal }) => getRelationships(signal)
  },
  {
    name: 'updateRelationships',
    description:
      '全量覆盖实体关系。每条关系给出 type 与两端（from/to：表名 + 列名），两端引用的表和列必须已存在（外键列须先建到表里）；建议先 getTables / getRelationships 再全量提交。',
    label: '更新实体关系',
    icon: Share,
    parameters: {
      type: 'object',
      properties: {
        relationships: {
          type: 'array',
          description: '完整关系列表（整体替换现有关系）',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: [...RELATIONSHIP_TYPES], description: '关系类型' },
              from: {
                type: 'object',
                description: '关系起点端',
                properties: {
                  table: { type: 'string', description: '表名' },
                  column: { type: 'string', description: '列名（如外键列）' }
                },
                required: ['table', 'column']
              },
              to: {
                type: 'object',
                description: '关系终点端',
                properties: {
                  table: { type: 'string', description: '表名' },
                  column: { type: 'string', description: '列名（如被引用的主键）' }
                },
                required: ['table', 'column']
              }
            },
            required: ['type', 'from', 'to']
          }
        }
      },
      required: ['relationships']
    },
    execute: (args: { relationships: RelationshipDef[] }, { signal }) =>
      replaceRelationships(args.relationships, signal)
  }
]
