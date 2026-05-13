# UDropdown — 下拉菜单

> `import type { DropdownProps, DropdownEmits, DropdownExposed } from '@veltra/desktop'`

基于 Floating UI 的下拉菜单组件，支持悬浮、点击、自定义三种触发方式，内容通过 Teleport 渲染。

## Import

```ts
// UDropdown 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `trigger` | `'hover' \| 'click' \| 'custom'` | `'hover'` | 触发方式：hover 悬浮、click 点击、custom 手动控制 |
| `width` | `string` | — | 下拉内容宽度，默认跟随触发元素宽度 |
| `minWidth` | `string` | — | 下拉内容最小宽度 |
| `contentTag` | `string` | `'div'` | 下拉内容容器标签 |
| `contentClass` | `unknown` | — | 下拉内容容器额外的 class |
| `contentStyle` | `CSSProperties \| string` | — | 下拉内容容器的 style |
| `visible` | `boolean` | — | 控制下拉框显示/隐藏（受控模式） |
| `disabled` | `boolean` | — | 禁用下拉框 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:visible` | `(visible: boolean)` | 下拉框显示或隐藏时触发 |
| `keydown` | `(event: KeyboardEvent)` | 下拉内容区域键盘事件 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `trigger` | — | 触发器内容，会作为触发悬浮/点击的节点 |
| `content` | — | 下拉菜单内容 |

## Exposed

```ts
interface DropdownExposed {
  /** 打开下拉菜单，可传入自定义触发元素 */
  open: (config?: { trigger?: HTMLElement }) => void
  /** 关闭下拉菜单 */
  close: () => void
  /** 更新下拉内容位置（适用于内容动态变化的场景，如级联选择器） */
  updateDropdown: () => void
}
```

## Examples

### 悬浮触发

```vue
<template>
  <UDropdown>
    <template #trigger>
      <UButton>悬浮打开</UButton>
    </template>
    <template #content>
      <div style="padding: 8px 12px">菜单内容</div>
    </template>
  </UDropdown>
</template>
```

### 点击触发

```vue
<template>
  <UDropdown trigger="click">
    <template #trigger>
      <UButton>点击打开</UButton>
    </template>
    <template #content>
      <div style="padding: 8px 12px">点击触发的菜单</div>
    </template>
  </UDropdown>
</template>
```

### 受控模式 + 键盘事件

```vue
<template>
  <UDropdown
    trigger="click"
    :visible="visible"
    @update:visible="visible = $event"
    @keydown="handleKeydown"
  >
    <template #trigger>
      <UButton>受控下拉</UButton>
    </template>
    <template #content>
      <div style="padding: 8px 12px">按 Esc 关闭</div>
    </template>
  </UDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    visible.value = false
  }
}
</script>
```

### 禁用状态

```vue
<template>
  <UDropdown disabled>
    <template #trigger>
      <UButton disabled>禁用状态</UButton>
    </template>
    <template #content>
      <div style="padding: 8px 12px">不会弹出</div>
    </template>
  </UDropdown>
</template>
```
