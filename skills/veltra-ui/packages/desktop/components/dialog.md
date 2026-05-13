# UDialog — 对话框

> `import type { DialogProps, DialogEmits, DialogExposed } from '@veltra/desktop'`

Teleport 到 body 的模态/非模态对话框，支持拖拽、最大化/还原、全屏。

## Import

```ts
// UDialog 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `boolean` | `true` | 显示或隐藏 |
| `title` | `string` | — | 弹框标题，header 的别名 |
| `header` | `string` | — | 弹框头部内容，别名是 header |
| `size` | `ComponentSize` | `'default'` | 大小尺寸 |
| `modal` | `boolean` | `true` | 显示模态层。为 `true` 时点击遮罩关闭对话框，为 `false` 时点击遮罩不关闭且可提升 z-index |
| `fullscreen` | `boolean` | — | 全屏 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(visible: boolean)` | 更新对话框的显示 |
| `closed` | — | 对话框完全关闭后触发的事件（淡出动画结束后） |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ maximized: boolean }` | 对话框主体内容。`maximized` 表示弹框当前是否处于最大化状态 |
| `header` | — | 自定义头部内容，默认渲染 `header` / `title` prop |
| `footer` | `{ close: () => void }` | 底部区域。通常放置操作按钮，调用 `close()` 关闭对话框 |
| `trigger` | — | 触发器。提供一个节点替代 v-model 手动控制显隐，点击该节点切换对话框状态 |

## Exposed

```ts
interface DialogExposed {
  close: () => void
}
```

## Examples

### 基础对话框

```vue
<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
</script>

<template>
  <u-button @click="visible = true">打开对话框</u-button>

  <u-dialog v-model="visible" title="提示">
    <p>这是对话框内容</p>

    <template #footer="{ close }">
      <u-button text @click="close()">取消</u-button>
      <u-button type="primary" @click="close()">确认</u-button>
    </template>
  </u-dialog>
</template>
```

### 使用 trigger 插槽

无需手动维护 `v-model`，由 trigger 插槽自动控制显隐。

```vue
<template>
  <u-dialog title="消息" @closed="console.log('已关闭')">
    <template #trigger>
      <u-button>打开对话框</u-button>
    </template>

    <p>通过 trigger 插槽控制显隐</p>
  </u-dialog>
</template>
```

### 非模态对话框

```vue
<template>
  <u-dialog v-model="visible" title="非模态" :modal="false">
    <p>不显示模态遮罩层，点击遮罩不会关闭</p>
  </u-dialog>
</template>
```

### 最大化与默认插槽作用域

```vue
<template>
  <u-dialog v-model="visible" title="详情">
    <template #default="{ maximized }">
      <p v-if="maximized">对话框已最大化</p>
      <p v-else>对话框处于正常尺寸</p>
    </template>
  </u-dialog>
</template>
```

### 表单对话框

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FormModel, formField } from '@veltra/desktop'

const visible = ref(false)
const model = new FormModel({
  name: formField({ value: '', required: true })
})

async function handleConfirm(close: () => void) {
  const valid = await model.validate()
  if (valid) {
    console.log(model.data)
    close()
  }
}
</script>

<template>
  <u-dialog v-model="visible" title="新建">
    <u-form :model="model">
      <u-input label="名称" field="name" />
    </u-form>

    <template #footer="{ close }">
      <u-button text @click="close()">取消</u-button>
      <u-button type="primary" @click="handleConfirm(close)">确认</u-button>
    </template>
  </u-dialog>
</template>
```
