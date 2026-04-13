# 通用

## button (UButton, UButtonGroup)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/button.ts
import type { ColorType, ComponentProps, DeconstructValue } from '@veltra/utils'
import type { Component, ShallowRef } from 'vue'

/** 按钮类型 */
export type ButtonType = ColorType

/** 按钮属性类型 */
export interface ButtonProps extends ComponentProps {
  /** 按钮类型 */
  type?: ButtonType
  /** 是否以文本形式展示 */
  text?: boolean
  /** 朴素模式 */
  plain?: boolean
  /** 加载中 */
  loading?: boolean
  /** 加载图标 */
  loadingIcon?: Component
  /** 圆形 */
  circle?: boolean
  /** 禁用 */
  disabled?: boolean
  /** 图标 */
  icon?: Component
  /** 图标大小, 单位px */
  iconSize?: number
  /** 图标位置 */
  iconPosition?: 'left' | 'right'
  /** 事件是否传播（冒泡或者捕获） */
  propagate?: boolean
}

export interface ButtonEmits {
  /** 点击事件 */
  (name: 'click', e: MouseEvent): void
}

/** 在组件内部引用 */
export interface _ButtonExposed {
  el: ShallowRef<HTMLButtonElement | undefined>
}

/** 按钮暴露的属性和方法 */
export type ButtonExposed = DeconstructValue<_ButtonExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/button/index.vue -->
<template>
  <div>
    <div class="space">
      <div>类别展示</div>
      <u-button>默认</u-button>

      <u-button :type="button.type" v-for="button of buttons" :disabled="undefined">
        {{ button.text }}
      </u-button>
    </div>

    <div class="space">
      <div>尺寸</div>
      <u-button type="primary" size="large">大按钮</u-button>
      <u-button type="primary">中按钮</u-button>
      <u-button type="primary" size="small">小按钮</u-button>
    </div>

    <div class="space">
      <div>圆形</div>
      <u-button type="primary" circle :icon="Edit"></u-button>
    </div>

    <!-- disabled -->
    <div class="space">
      <div>禁用</div>
      <u-button disabled>默认</u-button>
      <u-button disabled type="primary">主题</u-button>
      <u-button disabled type="success">成功</u-button>
      <u-button disabled type="warning">警告</u-button>
      <u-button disabled type="danger">危险</u-button>
      <u-button disabled type="info">信息</u-button>
    </div>

    <!-- loading -->
    <div class="space">
      <div>加载</div>
      <u-button loading :loadingIcon="Refresh">默认</u-button>
      <u-button loading type="primary">主题</u-button>
      <u-button loading type="success">成功</u-button>
      <u-button loading type="warning">警告</u-button>
      <u-button loading type="danger">危险</u-button>
      <u-button loading type="info">信息</u-button>
    </div>

    <!-- 朴素模式 -->
    <div class="space">
      <div>朴素模式</div>
      <u-button plain>默认</u-button>
      <u-button plain type="primary">主题</u-button>
      <u-button plain type="success">成功</u-button>
      <u-button plain type="warning">警告</u-button>
      <u-button plain type="danger">危险</u-button>
      <u-button plain type="info">信息</u-button>
    </div>

    <div class="space">
      <div>朴素模式和禁用</div>
      <u-button plain disabled>默认</u-button>
      <u-button plain disabled type="primary">主题</u-button>
      <u-button plain disabled type="success">成功</u-button>
      <u-button plain disabled type="warning">警告</u-button>
      <u-button plain disabled type="danger">危险</u-button>
      <u-button plain disabled type="info">信息</u-button>
    </div>

    <!-- text -->
    <div class="space">
      <div>text</div>
      <u-button text>默认</u-button>
      <u-button text type="primary" loading>主题</u-button>
      <u-button text type="success" disabled>成功</u-button>
      <u-button text type="warning">警告</u-button>
      <u-button text type="danger">危险</u-button>
      <u-button text type="info">信息</u-button>
    </div>

    <div class="space">
      <div>分组</div>
      <u-button-group v-slot="{ props }">
        <u-button
          v-for="(button, index) of buttons"
          :class="bem.is('active', index === active)"
          @click="active = index"
          v-bind="props"
        >
          {{ button.text }}
        </u-button>
      </u-button-group>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Edit, Refresh } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { shallowRef } from 'vue'

const buttons = [
  { type: 'primary', text: '主题' },
  { type: 'success', text: '成功' },
  { type: 'warning', text: '警告' },
  { type: 'danger', text: '危险' },
  { type: 'info', text: '信息' }
] as Array<{ type: any; text: string }>

const active = shallowRef(0)
</script>

<style lang="scss" scoped>
.space {
  padding: 8px;
  & > * {
    margin-right: 8px;
  }
}

.is-active {
  background-color: #ccc;
}
</style>
```

## icon (UIcon)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/icon.ts
/** 图标组件属性 */
export interface IconProps {
  /** 尺寸 */
  size?: `${number}px` | number
}

export interface IconEmits {}

/** 图标组件暴露的对象 */
export interface IconExposed {}
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/icon/index.vue -->
<template>
  <div class="icon-demo">
    <u-icon :size="16">
      <ArrowLeft />
    </u-icon>

    <u-icon :size="16">
      <ArrowRight />
    </u-icon>

    <u-icon :size="200">
      <Loading />
    </u-icon>

    <u-icon :size="20">
      <Check />
    </u-icon>
  </div>
</template>

<script lang="ts" setup>
import { ArrowLeft, ArrowRight, Check, Loading } from '@veltra/icons/normal'
</script>
```

## action (UAction, UActionGroup)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/action.ts
import type { DeconstructValue } from '@veltra/utils'

import type { ButtonProps } from './button'

/** 操作组件属性 */
export interface ActionProps extends ButtonProps {
  /** 是否需要确认 */
  needConfirm?: boolean

  /** 是否为下拉菜单中的操作项 */
  inDropdown?: boolean
}

/** 操作组组件属性 */
export interface ActionGroupProps {
  /** 是否加载中 */
  loading?: boolean
  /** 是否为圆形按钮， 适用于图标类 */
  circle?: boolean

  /** 最大可显示数量 */
  max?: number
}

/** 操作组件定义的事件 */
export interface ActionEmits {
  (e: 'run'): void
}

/** 操作组件暴露的属性和方法(组件内部使用) */
export interface _ActionExposed {}

/** 操作组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ActionExposed = DeconstructValue<_ActionExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/action/index.vue -->
<template>
  <div>
    <div style="text-align: right">
      <u-action-group>
        <u-action v-for="button of buttons">{{ button }}</u-action>
        <u-action need-confirm type="danger">删除</u-action>
        <u-action need-confirm type="danger">删除</u-action>
      </u-action-group>
    </div>
    <div>
      <u-table :columns="columns" :data="data" show-index checkable>
        <template #column:action>
          <u-action-group :max="4">
            <u-action v-for="button of buttons">{{ button }}</u-action>
            <u-action need-confirm type="danger">删除</u-action>
            <u-action need-confirm type="danger">删除</u-action>
          </u-action-group>
        </template>
      </u-table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import { shallowRef } from 'vue'

const columns = defineTableColumns([
  { name: '列1', key: 'col1' },
  { name: '列2', key: 'col2' },
  { name: '列3', key: 'col3' },
  { name: 'action', key: 'action', width: 150, align: 'center' }
])

const data = shallowRef<any[]>([])

setTimeout(() => {
  data.value = Array.from({ length: 10 }).map((item, i) => {
    return {
      col1: 'col1-' + i,
      col2: 'col2-' + i,
      col3: 'col3-' + i
    }
  })
}, 200)

const buttons = ['查看', '编辑', '审批']
</script>
```

## check-tag (UCheckTag)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/check-tag.ts
import type { DeconstructValue } from '@veltra/utils'

/** check-tag组件属性 */
export interface CheckTagProps {
  modelValue?: string

  checked?: boolean
}

/** check-tag组件定义的事件 */
export interface CheckTagEmits {
  (e: 'update:modelValue', value: boolean): void
}

/** check-tag组件暴露的属性和方法(组件内部使用) */
export interface _CheckTagExposed {}

/** check-tag组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CheckTagExposed = DeconstructValue<_CheckTagExposed>
```

### 使用示例

暂无示例

## theme (UTheme)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/theme.ts
import type { UITheme } from '@veltra/styles/theme'
import type { DeconstructValue } from '@veltra/utils'

/** 主题组件属性 */
export interface ThemeProps {
  /** 指定要编辑的主题实例，默认跟随当前已加载主题 */
  theme?: UITheme
}

/** 主题组件暴露的属性和方法(组件内部使用) */
export interface _ThemeExposed {
  /** 恢复到当前基线主题 */
  reset: () => void
  /** 导出当前主题 */
  exportTheme: () => void
  /** 应用浅色预设 */
  applyLightPreset: () => void
  /** 应用深色预设 */
  applyDarkPreset: () => void
}

/** 主题组件暴露的属性和方法 */
export type ThemeExposed = DeconstructValue<_ThemeExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/theme/index.vue -->
<template>
  <div class="theme-page">
    <u-theme />
  </div>
</template>

<script lang="ts" setup></script>
```

## palette (UPalette)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/palette.ts
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 色调 */
export interface PaletteRGB {
  r: number
  g: number
  b: number
}

/** 饱和度 亮度 */
export interface PaletteHSV {
  h: number
  s: number
  v: number
}

/** 调色盘组件颜色类型 */
export type PaletteColorType = 'HEX' | 'RGB'

/** 调色盘组件属性 */
export interface PaletteProps extends FormComponentProps {
  modelValue?: string
  disabled?: boolean
  readonly?: boolean
}

/** 调色盘组件定义的事件 */
export interface PaletteEmits {
  (e: 'update:modelValue', value: string): void
}

/** 调色盘组件暴露的属性和方法(组件内部使用) */
export interface _PaletteExposed {}

/** 调色盘组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PaletteExposed = DeconstructValue<_PaletteExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/palette/index.vue -->
<template>
  <div>
    <u-palette v-model="color" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color = ref('#131111')

// setTimeout(() => {
//   color.value = '#C715C799'
// }, 3000)
</script>

<style lang="scss" scoped></style>
```

## node-render (UNodeRender)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/node-render.ts
import type { VNode } from 'vue'

/** 虚拟dom渲染组件属性 */
export interface NodeRenderProps {
  content: null | undefined | Array<VNode> | VNode
}

/** 虚拟dom渲染暴露的属性和方法 */
export interface NodeRenderExposed {}
```

### 使用示例

暂无示例
