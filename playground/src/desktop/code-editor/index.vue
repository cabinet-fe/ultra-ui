<template>
  <div class="page">
    <section class="section">
      <h3>JS 示例</h3>
      <u-code-editor v-model="jsCode" lang="js" :langs="['js']" :default-lines="10" />
    </section>

    <section class="section">
      <h3>SQL 示例</h3>
      <u-code-editor v-model="sqlCode" lang="sql" :langs="['sql']" :default-lines="10" />
    </section>

    <section class="section">
      <h3>Java 示例</h3>
      <u-code-editor v-model="javaCode" lang="java" :langs="['java']" :default-lines="12" />
    </section>

    <section class="section">
      <h3>JSON 示例</h3>
      <u-code-editor v-model="jsonCode" lang="json" :langs="['json']" :default-lines="10" />
    </section>

    <section class="section">
      <h3>Markdown 示例</h3>
      <u-code-editor
        v-model="markdownCode"
        lang="markdown"
        :langs="['markdown']"
        :default-lines="12"
      />
    </section>

    <section class="section">
      <h3>SpEL 示例</h3>
      <u-code-editor v-model="spelCode" lang="spel" :langs="['spel']" :default-lines="6" />
    </section>

    <section class="section">
      <h3>Bash 示例</h3>
      <u-code-editor v-model="bashCode" lang="bash" :langs="['bash']" :default-lines="10" />
    </section>

    <section class="section">
      <h3>PowerShell 示例</h3>
      <u-code-editor
        v-model="powershellCode"
        lang="powershell"
        :langs="['powershell']"
        :default-lines="10"
      />
    </section>

    <section class="section">
      <h3>放大编辑</h3>
      <p class="hint">
        点击工具栏右侧放大按钮，编辑器放大到屏幕中央编写（Esc 或关闭按钮退出，内容实时同步）；下方为
        zoomable: false 对照，不渲染放大按钮。
      </p>

      <u-code-editor
        v-model="zoomCode"
        lang="js"
        :langs="['js', 'sql', 'json']"
        :default-lines="6"
      />

      <u-code-editor
        v-model="noZoomCode"
        lang="json"
        :langs="['json']"
        :zoomable="false"
        :default-lines="6"
      />
    </section>

    <section class="section">
      <h3>完整示例</h3>
      <p class="hint">可切换语言、配置默认行数，以及禁用 / 只读 / 暗色 / 函数体外壳。</p>

      <div class="toolbar">
        <u-checkbox v-model="disabled">禁用</u-checkbox>
        <u-checkbox v-model="readonly">只读</u-checkbox>
        <u-checkbox v-model="dark">暗色</u-checkbox>
        <u-checkbox v-model="showShell">函数体外壳</u-checkbox>

        <label class="control">
          <span>默认行数</span>
          <u-number-input v-model="defaultLines" :min="1" :max="40" style="width: 120px" />
        </label>

        <label class="control">
          <span>可选语言</span>
          <u-checkbox-group v-model="langs" :items="langOptions" />
        </label>
      </div>

      <u-form :model="formData" :disabled="disabled" :readonly="readonly">
        <u-code-editor
          field="code"
          v-model:lang="lang"
          :langs="langs"
          :prefix="showShell ? functionPrefix : undefined"
          :suffix="showShell ? functionSuffix : undefined"
          :dark="dark"
          :default-lines="defaultLines"
          label="代码"
          span="full"
          :rules="{ required: true }"
          @change="handleChange"
        />
      </u-form>

      <div class="previews">
        <div>
          <div class="preview-label">v-model（仅正文，实时）</div>
          <pre class="preview">{{ formData.code }}</pre>
        </div>
        <div>
          <div class="preview-label">@change（失焦且有变更）</div>
          <pre class="preview">{{ lastChange ?? '（尚未触发）' }}</pre>
        </div>
        <div v-if="showShell">
          <div class="preview-label">完整函数（prefix + body + suffix）</div>
          <pre class="preview">{{ fullFunction }}</pre>
        </div>
        <div>
          <div class="preview-label">当前语言（v-model:lang）</div>
          <pre class="preview">{{ lang }}</pre>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { CodeEditorLang } from '@veltra/desktop/types'
import { computed, reactive, ref } from 'vue'

const jsCode = ref(`function sum(a, b) {
  // 返回两数之和
  return a + b
}

const result = sum(1, 2)
console.log(result)
`)

const sqlCode = ref(`SELECT u.id, u.name, o.total
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.status = 'active'
  AND o.created_at >= '2026-01-01'
ORDER BY o.total DESC
LIMIT 20;
`)

const javaCode = ref(`public class Hello {
  public static int add(int a, int b) {
    return a + b;
  }

  public static void main(String[] args) {
    System.out.println(add(1, 2));
  }
}
`)

const jsonCode = ref(`{
  "name": "ultra-ui",
  "version": "1.0.0",
  "scripts": {
    "dev": "vp dev",
    "build": "vp pack"
  },
  "dependencies": {
    "vue": ">=3.5.0"
  }
}
`)

const markdownCode = ref(`# Ultra UI

A **Vue 3** component library with *BEM* + CSS variables.

## Features

- Code editor with syntax highlighting
- Form components
- Theme system

\`\`\`js
console.log('hello markdown')
\`\`\`

> Tip: switch languages via \`langs\` / \`v-model:lang\`.

[Docs](https://example.com) · ![logo](./logo.svg)
`)

const spelCode = ref(
  `#user?.name matches 'A.*' and T(Math).abs(-1) > 0 or #root.status eq 'ACTIVE'`
)

const bashCode = ref(`#!/usr/bin/env bash
set -euo pipefail

NAME="\${1:-world}"
echo "Hello, \${NAME}!"

if [[ -d "./dist" ]]; then
  ls -la ./dist
fi
`)

const powershellCode = ref(`param(
  [string]$Name = "world"
)

Write-Host "Hello, $Name!"

if (Test-Path "./dist") {
  Get-ChildItem ./dist
}
`)

const formData = reactive({ code: '  return a + b' })

const zoomCode = ref(`function fib(n) {
  return n < 2 ? n : fib(n - 1) + fib(n - 2)
}

console.log(fib(10))
`)

const noZoomCode = ref(`{
  "zoomable": false,
  "toolbar": "仅语言标签，无放大按钮"
}
`)

const disabled = ref(false)
const readonly = ref(false)
const dark = ref(false)
const showShell = ref(true)
const defaultLines = ref(8)
const lastChange = ref<string>()
const lang = ref<CodeEditorLang>('js')

const langOptions: { label: string; value: CodeEditorLang }[] = [
  { label: 'JS', value: 'js' },
  { label: 'SQL', value: 'sql' },
  { label: 'Java', value: 'java' },
  { label: 'JSON', value: 'json' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'SpEL', value: 'spel' },
  { label: 'Bash', value: 'bash' },
  { label: 'PowerShell', value: 'powershell' }
]

const langs = ref<CodeEditorLang[]>([
  'js',
  'sql',
  'java',
  'json',
  'markdown',
  'spel',
  'bash',
  'powershell'
])

const functionPrefix = 'function handle(a, b) {\n'
const functionSuffix = '\n}'

const fullFunction = computed(() => `${functionPrefix}${formData.code}${functionSuffix}`)

function handleChange(value: string) {
  lastChange.value = value
}
</script>

<style lang="scss" scoped>
.page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.hint {
  margin: 0;
  font-size: 13px;
  color: #606266;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.previews {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.preview-label {
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.preview {
  margin: 0;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  min-height: 48px;
}
</style>
