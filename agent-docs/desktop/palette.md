---
title: UPalette 调色板
description: 点击弹出取色面板的颜色选择器：饱和度/亮度区、色相条、透明度条与 HEX(A) 输入，v-model 绑定 HEX 字符串（8 位含透明度），支持禁用、只读与 UForm 表单集成。
aliases: [Palette, palette, 取色器, 颜色选择器, ColorPicker]
keywords: [modelValue, HEX, RGBA, alpha, PaletteColorType, HEX2RGBA, 取色器, 颜色选择, 透明度, 色相, 饱和度, 亮度, 颜色清除, 主题色选择]
---

# UPalette 调色板

`@veltra/desktop` 导出的颜色选择组件 `UPalette`：一个色块触发器，点击弹出取色面板（饱和度/亮度二维区、色相条、透明度条、HEX(A) 输入框与「清除」按钮），`v-model` 绑定 HEX 颜色字符串，透明度小于 1 时输出 8 位 HEX。

## 快速上手

```vue
<script setup lang="ts">
import { UPalette } from '@veltra/desktop'
import { ref } from 'vue'

const color = ref('#1E88E5')
</script>

<template>
  <UPalette v-model="color" />
  <!-- 拖动面板后 color 变为形如 '#1E88E5' 或含透明度的 '#1E88E580' -->
</template>
```

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 表单组件通用属性（UPalette 继承它） */
export interface FormComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?: number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段 */
  field?: string
  /** 是否禁用；禁用时点击不弹出面板 */
  disabled?: boolean
  /** 是否只读；只读时点击不弹出面板 */
  readonly?: boolean
  /** 校验规则 */
  rules?: ValidateRule
}

/** 调色盘组件属性 */
export interface PaletteProps extends FormComponentProps {
  /** 绑定颜色，HEX 字符串 */
  modelValue?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
}

/** 调色盘组件定义的事件 */
export interface PaletteEmits {
  (e: 'update:modelValue', value: string): void
}

/** 无暴露方法；模板 ref 上没有可调用的成员 */
export type PaletteExposed = Record<string, never>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `string` | `—`（无颜色） | 否 | 输入支持 `#rgb`、`#rgba`、`#rrggbb`、`#rrggbbaa`（`#` 可省略）及 `rgb()` / `rgba()` 函数表示；无法解析的值视为未绑定，不写回面板 |
| `disabled` | `boolean` | `false` | 否 | 禁用点击弹出面板 |
| `readonly` | `boolean` | `false` | 否 | 同禁用，点击不弹出面板 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 色块尺寸；`UForm` 内未单独设置时继承表单尺寸 |

### 输出格式

- 拖动面板输出大写 HEX：不透明为 `#RRGGBB`（6 位），透明度小于 1 时为 `#RRGGBBAA`（8 位，alpha 按 0~255 取整后转 HEX）
- 点击「清除」输出空字符串 `''`，同时透明度复位为 1 并收起面板
- HEX(A) 输入框只接受匹配 `/^#([0-9a-fA-F]{3,4}){1,2}$/` 的值

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: string` | 拖动 SV 区 / 色相条 / 透明度条、在输入框确认合法 HEX(A)、点击「清除」时 |

无插槽、无暴露方法。弹出面板由内置 `UTip`（`trigger="click"`）承载。

## 典型示例

### 绑定含透明度的颜色

```vue
<script setup lang="ts">
import { UPalette } from '@veltra/desktop'
import { ref } from 'vue'

// 8 位 HEX 初始化，透明度 80/255 约 0.5
const color = ref('#FF000080')
</script>

<template>
  <UPalette v-model="color" />
  <div :style="{ width: '80px', height: '24px', background: color }" />
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { UForm, UPalette } from '@veltra/desktop'
import { reactive } from 'vue'

// 需要主题初始化：入口已执行 loadTheme() 时表单才有颜色
const model = reactive({ brand: '#1E88E5' })
</script>

<template>
  <UForm :model="model">
    <!-- 表单内用 field 绑定，禁止再写 v-model -->
    <UPalette label="品牌色" field="brand" size="small" />
  </UForm>
</template>
```

### 禁用与只读

```vue
<script setup lang="ts">
import { UPalette } from '@veltra/desktop'
import { ref } from 'vue'

const a = ref('#409EFF')
const b = ref('#67C23A')
</script>

<template>
  <UPalette v-model="a" disabled />
  <UPalette v-model="b" readonly />
</template>
```

## 注意事项

> [!WARNING]
> - 绑定值是 HEX 字符串（`'#1E88E5'`、`'#FF000080'`、`''`），不是 `PaletteRGB` / `PaletteHSV` 对象；这两个类型仅用于内部色值换算。
> - 「清除」输出空字符串 `''`，不是 `null` / `undefined`；判断未选颜色用 `!color` 或 `color === ''`。
> - 面板触发方式固定为点击（`trigger="click"`），没有 hover 触发配置。
> - 放进 `UForm` 时必须用 `field` 绑定模型字段，禁止再写 `v-model`。
> - 在 UForm 中必须使用 field，禁止 v-model。
> - 输出的 HEX 为大写；与后端比对颜色时先统一大小写。
