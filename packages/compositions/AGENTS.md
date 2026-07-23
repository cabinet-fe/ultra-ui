# AGENTS.md — @veltra/compositions

Vue 3 组合式函数集合，为组件库提供可复用的有状态逻辑。

## 组合式函数

| 模块                  | 主要导出                                   | 用途                           |
| --------------------- | ------------------------------------------ | ------------------------------ |
| `use-component-props` | `useComponentProps`                        | 组件属性处理                   |
| `use-config`          | `useConfig`, `setDocumentSize`             | 全局配置（尺寸等）             |
| `use-dnd`             | `useDnD`（重导出 drag-and-drop 生态）      | 拖拽排序（`@formkit/drag-and-drop`） |
| `use-drag`            | `useDrag`                                  | 拖拽                           |
| `use-fallback-props`  | `useFallbackProps`, `useFormFallbackProps` | 多级属性回退                   |
| `use-focus`           | `useFocus`                                 | 焦点管理                       |
| `use-user-action`     | `useUserAction`                            | 用户动作期阻断 model 回流      |
| `use-model`           | `useModel`                                 | 双向绑定（local / proxy）      |
| `use-pop`             | `usePop`                                   | 浮层定位（`@floating-ui/dom`） |
| `use-reactive-size`   | `useReactiveSize`                          | 响应式尺寸                     |
| `use-resize-observer` | `useResizeObserver`                        | ResizeObserver                 |
| `use-transition`      | `useTransition`                            | 过渡动画                       |
| `use-virtualizer`     | `useVirtualizer`                           | 虚拟滚动低阶层                 |

## useModel

```ts
const model = useModel({ props, emit, local: true }) // 内部副本 + emit
const model = useModel({ props, emit, local: false }) // 完全受控
```

## 依赖

- **dependencies**：`@floating-ui/dom`、`@formkit/drag-and-drop`（`use-dnd` 重导出其 Vue 适配层与核心 API，下游应统一从本包导入，不要自行安装 `@formkit/drag-and-drop`）
- **peer**：`@cat-kit/core`、`@cat-kit/fe`、`@veltra/utils`、`vue`
- **被依赖**：`@veltra/styles`（theme）、`@veltra/desktop`

## 验证

```bash
bun run lint
vp pack -F @veltra/compositions
bun run build    # 下游 styles、desktop 依赖此包
```
