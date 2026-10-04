import { makeBEM, type BEM } from '@veltra/utils'

/**
 * 移动端类名前缀 `um-`（桌面端为 `u-`）
 *
 * 双端组件名刻意对齐，类名前缀必须分离：同一应用同时引入
 * `@veltra/desktop` 与 `@veltra/mobile` 时，同名组件的样式互不覆盖。
 * 对应 SCSS 侧 `@use ... with ($namespace: um)`。
 */
export const bem = makeBEM('um-')

export type MobileBEM<N extends string> = BEM<N, 'um-'>
