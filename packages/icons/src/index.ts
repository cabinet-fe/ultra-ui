/**
 * 包元信息 + 全部图标的具名导出（normal + colorful）。
 * 业务可优先使用 `@ultra-ui/icons/normal` / `@ultra-ui/icons/colorful` 以区分集合；
 * 仍支持按需子路径 `import X from '@ultra-ui/icons/vue/normal/...'`。
 */
export const packageName = '@ultra-ui/icons' as const
export * from './normal'
export * from './colorful'
