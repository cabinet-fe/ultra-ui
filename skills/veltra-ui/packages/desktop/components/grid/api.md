# UGrid — 栅格布局

> `import type { GridProps, GridEmits, GridExposed, GridItemProps, Breakpoint, BreakCols } from '@veltra/desktop'`

> 类型：`../../../generated/types/grid.ts`

基于 CSS Grid 的响应式栅格布局系统，支持断点自适应列数、动态跨距，通过 `UGrid` + `UGridItem` 组合使用。断点阈值：`xs`(578px)、`sm`(960px)、`md`(1366px)、`lg`(1920px)、`xl`。

## Import

```ts
// UGrid、UGridItem 由 Vite 自动导入，无需手动 import
```

## Sub-component: UGridItem — 栅格子项

`UGridItem` 必须作为 `UGrid` 的直接子节点使用，否则会在控制台输出警告。

### UGridItem Props

| prop   | type                                                                                     | default | 说明                                                                                            |
| ------ | ---------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `span` | `number \| 'full' \| { [BreakpointName]?: number \| 'full'; default: number \| 'full' }` | `1`     | 所占列数。`0` 表示隐藏该项；`'full'` 表示撑满整行；对象可按断点配置不同跨距，`default` 为回退值 |
| `tag`  | `string`                                                                                 | `"div"` | 根容器标签                                                                                      |

### UGridItem Slots

| slot      | 作用域 | 说明     |
| --------- | ------ | -------- |
| `default` | —      | 子项内容 |

---

> 示例见 [examples.md](./examples.md)
