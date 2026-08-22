// 报表纯 TS 内核（ADR-0003 决策 1）：渲染引擎 / 绑定 / 条件规则 / 查询参数 / 数据连接器 /
// Report Template（自包含模板与取数）/ Filter Bar 值规范化 / Filled Report XLSX 导出与打印 HTML。
// 框架无关、无 DOM 依赖；组件壳（UReportDesigner / UReportViewer）落 components/report/。

export * from './types'
export * from './binding'
export * from './rules'
export * from './params'
export * from './render'
export * from './connector'
export * from './template'
export * from './filter-bar'
export * from './export-xlsx'
export * from './print'
