# UCodeEditor 示例

## 基础用法

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const code = shallowRef('console.log("Hello, World!")')
</script>

<template>
  <u-code-editor v-model="code" language="js" />
</template>
```

## 暗色主题 + JSON 编辑

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const jsonCode = shallowRef(`{
  "name": "Ultra UI",
  "version": "1.0.0"
}`)
</script>

<template>
  <u-code-editor v-model="jsonCode" language="json" dark :default-lines="6" />
</template>
```

## 只读代码展示 + 自定义行数

```vue
<script setup lang="ts">
const snippet = `SELECT *
FROM users
WHERE status = 'active'
ORDER BY created_at DESC`
</script>

<template>
  <u-code-editor :model-value="snippet" language="sql" readonly :default-lines="5" />
</template>
```

## 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ script: '' })
</script>

<template>
  <u-form :model="form">
    <u-code-editor
      label="自定义脚本"
      field="script"
      language="js"
      :default-lines="12"
      tips="请输入合法的 JavaScript 代码"
    />
  </u-form>
</template>
```
