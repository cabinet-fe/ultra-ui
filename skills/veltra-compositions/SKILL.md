---
name: veltra-compositions
description: >
  @veltra/compositions 组合式函数（composable）文档与源码镜像。
  当实现或重构涉及组合式函数、composable、useModel、usePop、useVirtual、
  表单回退（useFallbackProps / useFormFallbackProps）、useConfig、
  useTransition、useDrag、useFocus、浮层定位、虚拟滚动、用户动作追踪等逻辑时使用。
  详细实现请读 `generated/modules/*.md`；集成模式见 references/usage-patterns.md。
---

# veltra-compositions

## 生成物

| 文件                                                         | 内容                                         |
| ------------------------------------------------------------ | -------------------------------------------- |
| [generated/modules/](generated/modules/)                     | 每个 `use-*` 一篇，含该模块下全部 `.ts` 源码 |
| [generated/manifest.json](generated/manifest.json)           | 同步时间与模块文件列表                       |
| [references/usage-patterns.md](references/usage-patterns.md) | desktop 中的真实调用片段                     |

运行 `bun run sync-veltra-compositions` 或 `bun run sync-skills` 可重新生成 `generated/`。

## 导入约定

```typescript
import {
  useModel,
  usePop,
  useVirtual,
  useTransition,
  useFallbackProps,
  useFormFallbackProps,
  useFormComponent,
  useConfig,
  useComponentProps,
  useDrag,
  useFocus,
  useReactiveSize,
  useResizeObserver,
  useObserverCallback,
  useUserAction
} from '@veltra/compositions'
```

按需只引入用到的函数即可；无默认导出。

## 函数速查（14）

| 函数                                        | 用途                                    | 关键参数 / 行为                               | 返回值要点                              |
| ------------------------------------------- | --------------------------------------- | --------------------------------------------- | --------------------------------------- |
| `useModel`                                  | 自定义 v-model（非 `defineModel` 场景） | `propName`、`local`（bool 或函数）、`shallow` | 类 ref 的 `{ value }`                   |
| `useUserAction`                             | 用户动作期间阻断 modelValue 回流副作用  | 无                                            | `{ userAction, isUserActive }`          |
| `useDrag`                                   | 拖拽（如对话框标题栏）                  | 目标 ref、边界等                              | 拖拽状态与控制                          |
| `useFocus`                                  | 焦点与 hover 语义                       | 回调                                          | `focus`、`handleFocus`、`handleBlur` 等 |
| `useTransition`                             | 过渡：`css` 或 `style`                  | `target`、`name` / style 关键帧               | `enter`、`leave`                        |
| `usePop`                                    | Popper 定位                             | `triggerRef`、`contentRef`、`direction`       | `update`、`popperContainerId`           |
| `useReactiveSize`                           | 响应式测量尺寸                          | 元素 / 尺寸源                                 | 尺寸 ref                                |
| `useResizeObserver` / `useObserverCallback` | `ResizeObserver` 与回调辅助             | 监听目标、选项                                | 见 `use-resize-observer` 源码           |
| `useVirtual`                                | 虚拟列表                                | `count`、`scrollEl`、`estimateSize`           | `virtualList`、`measureElement` 等      |
| `useFallbackProps`                          | props → 全局 config 回退                | 源对象数组、默认值表                          | 各字段 ref                              |
| `useFormFallbackProps`                      | 表单场景三级回退                        | `[formProps, props]` + 默认值                 | 同上                                    |
| `useFormComponent`                          | 表单 provide / inject                   | 父级传入 `props`；子级无参                    | `formProps`、`inForm` 等                |
| `useConfig`                                 | 全局文档/尺寸等配置                     | 读配置                                        | `config` 等                             |
| `useComponentProps`                         | 规范化组件 props                        | 视具体 API                                    | 见源码                                  |

## 按场景选用

### 状态与并发

- **useModel**：需要非 `modelValue` 的 prop 名、或 `local` 函数在受控/非受控间切换（如表格 `current` 行）。
- **useUserAction**：用户动作期间阻断由 `modelValue` 回流引起的同步副作用；通过 `userAction(fn)` 包装事件处理函数（不要自调用），副作用侧用 `isUserActive()` 早返。

### UI 交互

- **useDrag**、**useFocus**：对话框拖拽、输入框聚焦管理。
- **useTransition**：浮层、对话框内部需要程序触发 `enter`/`leave` 的过渡（常与 **usePop** 搭配）。

### 布局与列表

- **usePop**：下拉、Tooltip 等浮动层定位。
- **useReactiveSize**、**useResizeObserver**：随容器变化重算布局。
- **useVirtual**：大列表、下拉选项、表格体虚拟化。

### 表单

- **useFormComponent**：在 `UForm` 与子控件间同步上下文。
- **useFormFallbackProps**：表单子组件上统一 `size` / `disabled` / `readonly` 等。
- **useFallbackProps**：脱离表单时的同一套回退逻辑。
- **useConfig**：读取全局尺寸等，与 `@veltra/styles` 的 `loadTheme` 协同。

### 组件增强

- **useComponentProps**：对传入 props 做归一化或兼容层（见源码中注释）。

## 延伸阅读（旧版参考文档）

与 `generated/` 镜像互补：源码定位、模块地图与编写模式。

- [references/source-discovery.md](references/source-discovery.md)
- [references/api-map.md](references/api-map.md)
- [references/patterns.md](references/patterns.md)

## 维护

- 源码权威位置：`packages/compositions/src/`。
- 修改 API 后请运行 `bun run sync-veltra-compositions` 更新 `generated/`，以便技能文档与类型保持一致。
