/**
 * 包元信息 + 全部图标的具名导出（normal + colorful）。
 * 业务可优先使用 `@veltra/icons/normal` / `@veltra/icons/colorful` 以区分集合
 */
export const packageName = '@veltra/icons' as const
export * from './normal'
export * from './colorful'
