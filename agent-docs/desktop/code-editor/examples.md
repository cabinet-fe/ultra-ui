---
title: UCodeEditor 代码编辑器示例
description: 用 langs 与 v-model:lang 选择语言，独立使用走 v-model，表单内用 field
---

`UCodeEditor` 绑定字符串。`langs` 多于一种时顶部出现语言选择器，仅一种时显示语言名。当前语言用 `lang` / `v-model:lang`。`lang` 取值：`'js' | 'sql' | 'java' | 'json' | 'markdown' | 'spel' | 'bash' | 'powershell'`。`zoomable` 默认 `true`。独立使用用 `v-model`；放进 `UForm` 时写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { CodeEditorLang } from '@veltra/desktop'

const code = shallowRef('console.log(1)')
const lang = shallowRef<CodeEditorLang>('js')
</script>

<template>
  <u-code-editor
    v-model="code"
    v-model:lang="lang"
    :langs="['js', 'json', 'sql']"
    :default-lines="8"
  />
  <u-code-editor v-model="code" lang="json" :langs="['json']" :zoomable="false" />
</template>
```

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ snippet: '' })
</script>

<template>
  <u-form :model="form">
    <u-code-editor label="脚本" field="snippet" :langs="['js']" />
  </u-form>
</template>
```
