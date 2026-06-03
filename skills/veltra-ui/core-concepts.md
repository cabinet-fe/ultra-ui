# 核心概念

Veltra Ultra UI 的架构基础参考。组件 Props/Emits/Slots/Exposed 以 `generated/types/{组件名}.ts` 为准。

## BEM 类名

CSS 类前缀 `u-`，遵循 `.u-{block}__{element}--{modifier}`，状态用 `.is-{state}`。

```
.u-button                    Block
.u-button__icon              Element
.u-button--primary           Modifier
.u-button.is-disabled        State
```

### 编程式生成

`bem(name)` 是 `makeBEM('u-')` 的工厂实例（导出自 `@veltra/utils`），自定义前缀用 `makeBEM('my-')`。

```ts
import { bem } from '@veltra/utils'
const cls = bem('button')

cls.b // 'u-button'
cls.e('icon') // 'u-button__icon'
cls.m('primary') // 'u-button--primary'
cls.em('icon', 'left') // 'u-button__icon--left'
cls.is('disabled', true) // 'is-disabled'（false 返回空字符串）
cls.create('custom') // 'u-button-custom'
```

## 主题系统

CSS 变量驱动，支持多态视觉风格（Standard / Shadcn / Hero / Glass）与亮/暗切换。完整 SCSS API 见 `packages/styles.md`，TS 端运行时 API 见同文 Theme 系统章节。预设主题与设计令牌完整定义见 `design-system/design.md`。

```ts
import { loadTheme, setTheme } from '@veltra/styles/theme'
import { heroLightTheme, glassLightTheme, lightTheme } from '@veltra/styles/theme'

loadTheme() // 默认 light + dark，跟随系统
loadTheme(heroLightTheme) // 单主题（不支持 setTheme）
loadTheme(lightTheme.new({ color: { primary: '#ff6600' } })) // 派生
setTheme('dark' | 'light' | 'auto') // 仅默认双主题模式可切换
```

### CSS 变量命名

变量名规则：`--{namespace}-{basename}-{node1}-{node2}...`，`namespace` 默认 `u`。在 SCSS 中通过 `fn.use-var()` 引用（详见 `packages/styles.md`）。

```
--u-color-primary
--u-text-color-main
--u-bg-color-bottom
--u-border-muted
--u-radius-default
--u-form-component-height-default
```

## 尺寸系统

所有组件统一支持 `'small' | 'default' | 'large'`，回退链：

```
组件 props → Form 上下文 → useConfig 全局配置 → 'default'
```

```ts
import { useConfig } from '@veltra/compositions'
const { config, setConfig } = useConfig()

setConfig({ size: 'large', animation: false })
config.size // 'large'
config.form.labelWidth // 表单 label 默认宽度
config.paginator.pageSize // 默认每页条数
```

## 颜色类型

```ts
type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'
```

支持 `type` 的组件：Button / Tag / Action / Alert 类与 message / Notification 等函数式 API。

## 组件通信

Veltra 组件用 `provide` / `inject` 共享父子上下文，不依赖全局状态。

- **表单上下文**：`UForm` provide → `UInput` / `USelect` 等自动继承 `size` / `disabled` / `readonly`
- **复杂组件 DI**：Table / Menu / Tree 通过 `InjectionKey` 共享行/节点状态

公共 Props 接口（`size`、`FormComponentProps` 等）与各组件差异见 `generated/types/{组件名}.ts`；易错 v-model / 表单用法见 `gotchas.md`。
