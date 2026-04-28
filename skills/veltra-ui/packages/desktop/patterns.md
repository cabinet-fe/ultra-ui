# Desktop — 通用模式

所有 Veltra 组件遵循的统一模式。

## Props 模式

### 通用 Props

所有组件至少支持 `size`：

```ts
interface ComponentProps {
  size?: 'small' | 'default' | 'large'
}
```

表单组件额外支持：

```ts
interface FormComponentProps extends ComponentProps {
  tips?: string
  span?: number
  label?: string
  field?: string
  disabled?: boolean
  readonly?: boolean
}
```

### 颜色类型

支持颜色语义化的组件接受 `type`：

```ts
type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'
```

```vue
<u-button type="primary">主要</u-button>
<u-button type="danger">危险</u-button>
<u-tag type="success">成功</u-tag>
```

### 双向绑定

使用 Vue 3.4+ 的 `defineModel` 或传统 `v-model`：

```vue
<!-- v-model（默认 prop: modelValue, event: update:modelValue） -->
<u-input v-model="text" />

<!-- 多个 v-model -->
<u-dialog v-model:visible="show" />

<!-- v-model 数组（多选组件） -->
<u-select v-model="selected" :options="options" multiple />
```

### 尺寸回退

所有组件通过 `useFallbackProps` 实现多级回退：

```
组件 props.size → Form 上下文 → useConfig 全局配置 → 'default'
```

## Emits 模式

### 命名规范

```ts
// 标准 emit
emit('click', event: MouseEvent)
emit('change', value: T)
emit('update:modelValue', value: T)
emit('update:visible', value: boolean)
emit('close')
```

### 用法

```vue
<u-button @click="handleClick">点击</u-button>
<u-input @change="handleChange" />
<u-dialog v-model:visible="show" @closed="onClosed" />
```

## Slots 模式

### 默认插槽

```vue
<u-button>按钮文字</u-button>
<u-dialog title="标题">
  <p>对话框内容</p>
</u-dialog>
```

### 命名插槽

常见命名插槽：

| 插槽名 | 出现组件 | 用途 |
|--------|----------|------|
| `icon` | Button, Input | 前置图标 |
| `prefix` | Input, Select | 前缀内容 |
| `suffix` | Input, Select | 后缀内容 |
| `header` | Table, Card | 头部 |
| `footer` | Dialog, Card | 底部 |
| `empty` | Table, List | 空数据展示 |
| `default` | 所有 | 主要内容 |

### 示例

```vue
<u-button type="primary">
  <template #icon><Search /></template>
  搜索
</u-button>

<u-input v-model="text" placeholder="搜索">
  <template #prefix><Search /></template>
  <template #suffix><Close @click="text = ''" /></template>
</u-input>

<u-dialog v-model:visible="show" title="用户信息">
  <u-form><!-- 表单内容 --></u-form>
  <template #footer="{ close }">
    <u-button @click="close">取消</u-button>
    <u-button type="primary" @click="save(); close()">保存</u-button>
  </template>
</u-dialog>
```

## Exposed 模式

组件通过 `defineExpose` 暴露内部引用：

```ts
// 内部类型（带下划线前缀）
interface _ButtonExposed {
  el: ShallowRef<HTMLButtonElement | undefined>
}

// 导出类型（解构 ref）
type ButtonExposed = DeconstructValue<_ButtonExposed>
// 等价于：{ el: HTMLButtonElement | undefined }
```

### 使用 Exposed

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ButtonExposed } from '@veltra/desktop'

const btnRef = ref<ButtonExposed>()

function focus() {
  btnRef.value?.el?.focus()
  // 或 btnRef.value?.el?.click()
}
</script>

<template>
  <u-button ref="btnRef" @click="handleClick">按钮</u-button>
</template>
```

### 常见 Exposed

| 组件 | Exposed | 类型 |
|------|---------|------|
| Button | `el` | `HTMLButtonElement` |
| Input | `el` | `HTMLInputElement` |
| Select | `el` | `HTMLElement` |
| Dialog | `el` | `HTMLElement` |
| Table | `el` | `HTMLElement` |
| Form | `el` | `HTMLFormElement` |

## 事件处理模式

### 阻止冒泡

```vue
<u-button @click.stop="handleClick">不冒泡</u-button>
```

### 事件参数

```ts
// Button click
<u-button @click="(e: MouseEvent) => {}" />

// Input change
<u-input @change="(value: string) => {}" />

// Select change
<u-select @change="(value: string | string[]) => {}" />
```

## 表单上下文传递

```
UForm （provide formProps）
  └── UFormItem
       └── UInput （inject formProps → 自动继承 size/disabled/readonly）
```

无需手动传递 props，嵌套在 `UForm` 内的表单组件自动继承表单上下文。

## 条件渲染注意事项

某些组件内部的子组件通过 `v-if` 按需渲染，使用时注意：

- `v-if` 内的组件在挂载时才会触发 `mounted`
- `v-show` 内组件始终挂载，适用于频繁切换的场景
- 对话框等浮层组件通过 `v-model:visible` 控制，内部使用 `v-if`/`Teleport`

## 组件目录约定

| 约定 | 示例 |
|------|------|
| 组件名 | `U` + PascalCase（`UButton`） |
| 目录名 | kebab-case（`button`） |
| CSS 类 | `u-` + BEM（`u-button`、`u-button__icon`） |

