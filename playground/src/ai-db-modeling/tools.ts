/**
 * AI 数据库建模的 9 个对话工具：8 个映射 `/ai-db-api` REST 端点（见 api.ts），
 * renderStats 为纯渲染工具（入参来自此前 queryData 的结果，execute 不发起任何请求）。
 * execute 全部走 api.ts 或本地校验，错误文案由服务端 400/404 响应透出后回灌模型自行修正。
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
  COLUMN_TYPES,
  createTable,
  deleteTable,
  getRelationships,
  getTables,
  insertRows,
  queryData,
  RELATIONSHIP_TYPES,
  replaceRelationships,
  updateTable,
  type QueryDataParams,
  type RelationshipDef,
  type RowData,
  type TableDef
} from './api'
import QueryCard from './query-card.vue'
import { CHART_TYPES, validateRenderStatsInput, type RenderStatsInput } from './render-stats-input'
import StatsReport from './stats-report.vue'

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
    name: 'queryData',
    description:
      '查询单表数据：不带 groupBy/aggregations 时返回明细行（filter 为受控等值过滤，null 匹配空值）；带 groupBy 或 aggregations 时做聚合统计，聚合计算在服务端完成——所有数字统计一律用本工具，禁止自行计算。响应含 display 展示投影（列标题为中文 comment、外键值已解析为关联名称、不含主键列），可直接用于组装 renderStats 的入参。',
    label: '查询数据',
    icon: Search,
    render: QueryCard,
    // 回复流工具：结果卡片常驻展示在回复中，不随步骤行折叠
    renderTo: 'reply',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: '目标表名' },
        filter: { type: 'object', description: '等值过滤条件（可选，键为列名）' },
        groupBy: {
          type: 'array',
          description: '分组维度列（可选；聚合查询用）',
          items: { type: 'string' }
        },
        aggregations: {
          type: 'array',
          description: '聚合列表（可选；带 groupBy 时必须至少一项）',
          items: {
            type: 'object',
            properties: {
              func: { type: 'string', enum: [...AGGREGATION_FUNCS], description: '聚合函数' },
              column: {
                type: 'string',
                description: '聚合列（count 可省略；sum/avg/min/max 用 number 列）'
              }
            },
            required: ['func']
          }
        }
      },
      required: ['table']
    },
    execute: (args: QueryDataParams, { signal }) => queryData(args, signal)
  },
  {
    name: 'renderStats',
    description:
      '渲染统计报告（纯渲染，不查数据、不发起请求）：把此前 queryData 的查询结果组装为「中文摘要 + 明细表 + 多图表」卡片。summary 为中文结论；rawData 键名用中文可读值（取查询结果 display 投影的中文标题与关联名称），不带 id 类技术列；charts 可多张（bar/line/pie），labels 与系列名用中文；所有数字取自查询结果，不要自行计算。',
    label: '统计报告',
    icon: ChartPie,
    render: StatsReport,
    renderTo: 'reply',
    parameters: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: '中文统计结论摘要（非空）' },
        rawData: {
          type: 'array',
          description: '明细行列表（键用中文可读值，不含 id 类技术列）',
          items: { type: 'object', description: '一行数据（中文键 → 标量值）' }
        },
        charts: {
          type: 'array',
          description: '图表列表（可多张，可为空数组）',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: [...CHART_TYPES], description: '图表类型' },
              title: { type: 'string', description: '图表标题（可选）' },
              data: {
                type: 'object',
                description: '图表数据',
                properties: {
                  labels: {
                    type: 'array',
                    description: '分类轴标签（中文）',
                    items: { type: 'string' }
                  },
                  series: {
                    type: 'array',
                    description: '数据系列（至少一个）',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: '系列名（中文）' },
                        values: {
                          type: 'array',
                          description: '数值数组（与 labels 等长）',
                          items: { type: 'number' }
                        }
                      },
                      required: ['name', 'values']
                    }
                  }
                },
                required: ['labels', 'series']
              }
            },
            required: ['type', 'data']
          }
        }
      },
      required: ['summary', 'rawData', 'charts']
    },
    execute: (args: RenderStatsInput) => {
      const result = validateRenderStatsInput(args)
      if (!result.ok) throw new Error(result.error)
      return {
        rendered: true,
        charts: result.value.charts.length,
        rows: result.value.rawData.length
      }
    }
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
