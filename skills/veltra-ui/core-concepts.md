# 核心概念

Veltra Ultra UI 的架构基础——BEM 命名、主题系统、尺寸系统、组件模式。

## BEM 命名规范

所有 CSS 类名遵循 BEM 规范，前缀 `u-`。

### 类名结构

```
.u-button                       // Block（块）
.u-button__icon                 // Element（元素）
.u-button--primary              // Modifier（修饰符）
.u-button.is-disabled           // State（状态）
.u-button--size-small           // Size modifier
```

### 分隔符

- `__` 连接块与元素（Element）
- `--` 连接块/元素与修饰符（Modifier）
- `.is-` 表示状态（State）

### Vue 模板中的运用

```vue
<template>
  <!-- Block: u-button -->
  <button :class="[cls.b, cls.m(size), cls.is('disabled', disabled)]">
    <!-- Element: u-button__icon -->
    <span :class="cls.e('icon')"><u-icon /></span>
    <!-- Element: u-button__text -->
    <span :class="cls.e('text')"><slot /></span>
  </button>
</template>
```

### 编程式生成 BEM 类名

```ts
import { bem } from '@veltra/utils'

const cls = bem('button')

cls.b // 'u-button'
cls.e('icon') // 'u-button__icon'
cls.m('primary') // 'u-button--primary'
cls.em('icon', 'left') // 'u-button__icon--left'
cls.is('disabled', true) // 'u-button.is-disabled' 或 ''
cls.create('custom-class') // 'u-button-custom-class'
```

`bem` 是 `makeBEM('u-')` 返回的工厂实例。若需要自定义前缀：

```ts
import { makeBEM } from '@veltra/utils'

const myCls = makeBEM('my-') // 前缀 'my-'
myCls.e('icon') // 'my-button__icon'
```

## 主题系统

主题通过 CSS 自定义属性（CSS Variables）实现，支持多态视觉风格（Standard、Shadcn、Hero、Glass）与亮色/暗色切换。

有关 4 套预设主题完整配置、设计令牌（Design Tokens）映射、SCSS 开发红黑榜，详见 [design-system/design.md](design-system/design.md)。

### CSS 变量命名

```
--u-color-primary        → 主色
--u-bg-color-bottom      → 背景色
--u-text-color-main      → 主要文字色
--u-border-muted         → 弱化边框简写（表单类组件常用）
--u-radius-default       → 圆角
--u-form-component-height-default → 表单控件高度
--u-shadow-color         → 阴影色
```

### 在 SCSS 中引用变量

```scss
@use 'pkg:@veltra/styles/functions' as fn;

.my-element {
  color: fn.use-var(text-color, main); // var(--u-text-color-main)
  font-size: fn.use-var(font-size, main);
  height: fn.use-var(form-component-height, default);
}

// 组件级变量（组件自身覆盖）
.component {
  --u-component-bg: fn.use-var(color, primary);
  background: fn.component-var(component, bg); // var(--u-component-bg)
}
```

### 在 JS/TS 中操作主题

```ts
import { loadTheme, setTheme, currentTheme } from '@veltra/styles/theme'
import { lightTheme, darkTheme } from '@veltra/styles/theme'
import { heroLightTheme, glassLightTheme } from '@veltra/styles/theme'

// 加载主题（默认注入 light + dark 预设）
loadTheme()

// 加载预设主题
loadTheme(heroLightTheme) // HeroUI 风格
loadTheme(glassLightTheme) // 玻璃拟态风格

// 切换主题（仅 light/dark 双主题模式支持）
setTheme('dark')
setTheme('light')
setTheme('auto') // 跟随系统 prefers-color-scheme

// 自定义主题
const custom = lightTheme.new({ color: { primary: '#ff6600' }, radius: { default: 8 } })
loadTheme(custom)
```

主题注入使用 `CSSStyleSheet.adoptedStyleSheets`（优先级高）或回退到传统 `<style>` 标签。

## 尺寸系统

组件统一支持三种尺寸：`'small' | 'default' | 'large'`。

### 组件 Props

```vue
<u-button size="small">小按钮</u-button>
<u-button size="default">默认按钮</u-button>
<u-button size="large">大按钮</u-button>
```

### 全局默认尺寸

```ts
import { useConfig } from '@veltra/compositions'

const { config, setConfig } = useConfig()

// 全局设为 large
setConfig({ size: 'large' })

// 读取当前设置
console.log(config.size) // 'large'
console.log(config.animation) // true（是否开启动画）
console.log(config.form.labelWidth) // label 默认宽度
```

### 尺寸回退链

组件通过 `useFallbackProps` 实现多级回退：

```
组件 props → Form 上下文 → 全局 config → 硬编码默认值
```

## 颜色类型

组件支持 5 种语义颜色 + 1 种默认：

```ts
type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'
```

```vue
<u-button type="primary">主要</u-button>
<u-button type="success">成功</u-button>
<u-button type="danger">危险</u-button>
<u-tag type="warning">警告标签</u-tag>
```

颜色值由主题 CSS 变量提供，切换主题时自动变化。

## 组件通信模式

Veltra 组件间使用 Vue 的 `provide`/`inject` 进行父子通信，而非依赖全局状态。

### 表单上下文

```
UForm (provide formProps)
  └── UFormItem
       └── UInput (inject formProps → 自动继承 size/disabled/readonly)
```

### 复杂组件 DI

Table、Menu、Tree 等复杂组件通过 `InjectionKey` 共享上下文：

```ts
// 父组件
provide(TableDIKey, { rows, columns, handleRowClick, ... })

// 子组件（TableRow、TableCell 等）
const { rows, handleRowClick } = inject(TableDIKey)!
```

## 组件通用 Props

所有组件继承的基础接口：

```ts
interface ComponentProps {
  size?: 'small' | 'default' | 'large'
}

interface FormComponentProps extends ComponentProps {
  tips?: string
  span?:
    | number
    | 'full'
    | ({ [key in BreakpointName]?: number | 'full' } & { default: number | 'full' })
  label?: string
  field?: string
  disabled?: boolean
  readonly?: boolean
}
```

## 组件通用模板

每个组件的标准结构：

```vue
<template>
  <div :class="classList" ref="rootRef">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { useFallbackProps } from '@veltra/compositions'
import { computed, shallowRef } from 'vue'

defineOptions({ name: 'ComponentName' })

const props = withDefaults(defineProps<ComponentProps>(), { size: 'default' })
const emit = defineEmits<ComponentEmits>()

const cls = bem('component-name')
const { size } = useFallbackProps([props], { size: 'default' })

const classList = computed(() => [cls.b, cls.m(size.value), cls.is('disabled', props.disabled)])

const rootRef = shallowRef<HTMLElement>()
defineExpose({ el: rootRef })
</script>
```

## 下一步

- packages/desktop/index.md — 浏览具体组件
- packages/desktop/patterns.md — 组件 Props/Emits/Slots 通用模式
- packages/compositions.md — 可复用的组合式函数
