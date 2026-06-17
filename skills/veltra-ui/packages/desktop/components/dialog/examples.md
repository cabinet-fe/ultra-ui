# UDialog 示例

## 基础对话框

```vue
<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
</script>

<template>
  <u-button @click="visible = true">打开对话框</u-button>

  <u-dialog v-model="visible" title="提示" style="width: 680px">
    <p>这是对话框内容</p>

    <template #footer="{ close }">
      <u-button text @click="close()">取消</u-button>
      <u-button type="primary" @click="close()">确认</u-button>
    </template>
  </u-dialog>
</template>
```

## 使用 trigger 插槽

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

## 非模态对话框

```vue
<template>
  <u-dialog v-model="visible" title="非模态" :modal="false">
    <p>不显示模态遮罩层，点击遮罩不会关闭</p>
  </u-dialog>
</template>
```

## 最大化与默认插槽作用域

```vue
<template>
  <u-dialog v-model="visible" title="详情">
    <template #default="{ maximized }">
      <!-- 可以利用 maximized 来做一些操作，比如设置高度 100% 来让内容也跟着全屏 -->
      <p v-if="maximized">对话框已最大化</p>
      <p v-else>对话框处于正常尺寸</p>
    </template>
  </u-dialog>
</template>
```

## 表单对话框

```vue
<script setup lang="ts">
import { reactive, ref, useTemplateRef } from 'vue'

const visible = ref(false)
const formRef = useTemplateRef('form')
const formData = reactive({ name: '' })

async function handleConfirm(close: () => void) {
  const valid = await formRef.value?.validate()
  if (valid) {
    console.log(formData)
    close()
  }
}
</script>

<template>
  <u-dialog v-model="visible" title="新建">
    <u-form ref="form" :model="formData">
      <u-input label="名称" field="name" :rules="{ required: true }" />
    </u-form>

    <template #footer="{ close }">
      <u-button text @click="close()">取消</u-button>
      <u-button type="primary" @click="handleConfirm(close)">确认</u-button>
    </template>
  </u-dialog>
</template>
```
