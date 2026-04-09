# AGENTS.md — @ultra-ui/compositions

Vue 3 组合式函数集合，为组件库提供可复用的有状态逻辑。

## 组合式函数列表

| 模块 | 主要导出 | 用途 |
| ---- | -------- | ---- |
| `load-theme` | `loadTheme`, `setTheme`, `currentTheme` | 主题加载与切换（SSR 兼容需在 `onMounted` 中调用） |
| `theme`（`@ultra-ui/compositions/theme`） | `UITheme`, `lightTheme`, `darkTheme`, `Theme` 类型, `cssVar`, `mixColor`, `HEXToRGB` 等 | 主题类、内置预设、全局 token 类型与颜色辅助 |
| `use-component-props` | `useComponentProps` | 组件属性处理 |
| `use-config` | `useConfig`, `setDocumentSize` | 全局配置（尺寸等） |
| `use-drag` | `useDrag` | 拖拽行为 |
| `use-fallback-props` | `useFallbackProps`, `useFormFallbackProps` | 多级属性回退（组件 → 表单 → 全局配置） |
| `use-focus` | `useFocus` | 焦点管理 |
| `use-form-component` | `useFormComponent` | 表单上下文注入/消费（provide/inject） |
| `use-lock` | `useUpdateLock` | 更新锁（防止并发更新） |
| `use-model` | `useModel` | 双向绑定封装（local/proxy 两种模式） |
| `use-pop` | `usePop` | 浮框定位（基于 `@floating-ui/dom`） |
| `use-reactive-size` | `useReactiveSize` | 响应式尺寸监听 |
| `use-resize-observer` | `useResizeObserver`, `useObserverCallback` | ResizeObserver 封装 |
| `use-transition` | `useTransition` | 过渡动画（css/style 两种模式） |
| `use-virtual` | `useVirtual` | 虚拟滚动 |

## 表单组件相关

表单组件通常组合使用以下函数：

```ts
// 表单组件（如 UForm）—— 提供上下文
useFormComponent(props)

// 表单内的子组件（如 UInput）—— 消费上下文
const { inForm, formProps } = useFormComponent()

// 属性回退：组件 props → 表单 props → 全局配置 → 默认值
const { size, disabled, readonly } = useFormFallbackProps([formProps, props])
```

## useModel 模式

```ts
// local 模式（默认）：组件内部维护状态副本，同时 emit 更新
const model = useModel({ props, emit, local: true })

// proxy 模式：不维护本地状态，完全受控
const model = useModel({ props, emit, local: false })
```

## 依赖

- **依赖**：`@cat-kit/core`、`@ultra-ui/utils`
- **peer**：`vue ^3.5.0`
- **被依赖**：`@ultra-ui/desktop`
