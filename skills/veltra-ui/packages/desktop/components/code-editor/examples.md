# UCodeEditor 示例

## 基础用法

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const code = shallowRef('console.log("Hello, World!")')
</script>

<template>
  <u-code-editor v-model="code" :langs="['js']" />
</template>
```

## 多语言切换（内置选择器）

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { CodeEditorLang } from '@veltra/desktop/types'

const code = shallowRef('SELECT 1')
const lang = shallowRef<CodeEditorLang>('sql')
</script>

<template>
  <u-code-editor v-model="code" v-model:lang="lang" :langs="['js', 'sql', 'json']" />
</template>
```

## 函数体外壳（prefix / suffix）

`v-model` 仅绑定可编辑正文，前后缀只展示不可编辑：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const body = shallowRef('  return a + b')
const prefix = 'function handle(a, b) {\n'
const suffix = '\n}'
</script>

<template>
  <u-code-editor
    v-model="body"
    :langs="['js']"
    :prefix="prefix"
    :suffix="suffix"
  />
</template>
```

## Markdown 编辑

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const md = shallowRef(`# Title

Write **bold** and *italic* text.

\`\`\`js
console.log('hello')
\`\`\`
`)
</script>

<template>
  <u-code-editor v-model="md" :langs="['markdown']" :default-lines="10" />
</template>
```

## SpEL 表达式

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const expr = shallowRef('#root.name == \'admin\' and T(Math).abs(-1) > 0')
</script>

<template>
  <u-code-editor v-model="expr" :langs="['spel']" :default-lines="4" />
</template>
```

## Bash 脚本

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const script = shallowRef(`#!/usr/bin/env bash
set -euo pipefail
echo "Hello, \${1:-world}!"
`)
</script>

<template>
  <u-code-editor v-model="script" :langs="['bash']" :default-lines="6" />
</template>
```

## PowerShell 脚本

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const script = shallowRef(`param([string]$Name = "world")
Write-Host "Hello, $Name!"
`)
</script>

<template>
  <u-code-editor v-model="script" :langs="['powershell']" :default-lines="4" />
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
  <u-code-editor v-model="jsonCode" :langs="['json']" dark :default-lines="6" />
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
  <u-code-editor :model-value="snippet" :langs="['sql']" readonly :default-lines="5" />
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
      :langs="['js']"
      :default-lines="12"
      tips="请输入合法的 JavaScript 代码"
    />
  </u-form>
</template>
```
