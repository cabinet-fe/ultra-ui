# UDialog — 对话框

> `import type { DialogProps, DialogExposed } from '@veltra/desktop'`

Teleport 到 body 的模态/非模态对话框，支持全屏、拖拽、最大化。

## Import

```ts
import { UDialog } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `boolean` | — | 显示/隐藏 |
| `title` | `string` | — | 标题（`header` 别名） |
| `header` | `string` | — | 头部内容 |
| `size` | `ComponentSize` | — | 尺寸 |
| `modal` | `boolean` | `true` | 模态（点击遮罩关闭） |
| `fullscreen` | `boolean` | — | 全屏 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(visible: boolean)` | 显示状态变化 |
| `closed` | — | 完全关闭后（动画结束） |

## Exposed

```ts
interface DialogExposed {
  close: () => void
}
```

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | — | 内容 |
| `header` | — | 自定义头部 |
| `footer` | `{ close: () => void }` | 底部按钮区 |
| `trigger` | — | 触发器（替代 v-model 手动控制） |

## Examples

### 基础对话框

```vue
<script setup>
import { ref } from 'vue'
const visible = ref(false)
</script>

<template>
  <u-button @click="visible = true">打开</u-button>

  <u-dialog v-model="visible" title="对话框标题">
    <p>这是对话框内容</p>
    <template #footer="{ close }">
      <u-button text @click="close()">取消</u-button>
      <u-button type="primary" @click="close()">确认</u-button>
    </template>
  </u-dialog>
</template>
```

### 表单对话框

```vue
<script setup>
import { ref } from 'vue'
import { FormModel, formField } from '@veltra/desktop'

const visible = ref(false)
const model = new FormModel({ name: formField({ value: '', required: true }) })

async function handleConfirm(close: () => void) {
  const valid = await model.validate()
  if (valid) {
    console.log(model.data)
    close()
  }
}
</script>

<template>
  <u-dialog v-model="visible" title="新建" :modal="true">
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

### 对话框内放 Tabs

```vue
<u-dialog v-model="visible" title="设置">
  <u-tabs :items="tabItems" v-model="activeTab" keep-alive>
    <template #general><p>通用设置</p></template>
    <template #security><p>安全设置</p></template>
  </u-tabs>
</u-dialog>
```
