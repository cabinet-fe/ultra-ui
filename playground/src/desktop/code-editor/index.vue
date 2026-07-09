<template>
  <div class="page">
    <div class="toolbar">
      <u-checkbox v-model="disabled">禁用</u-checkbox>
      <u-checkbox v-model="readonly">只读</u-checkbox>
      <u-checkbox v-model="dark">暗色</u-checkbox>
      <u-checkbox v-model="showShell">函数体外壳</u-checkbox>

      <label class="lines-control">
        <span>默认行数</span>
        <u-number-input v-model="defaultLines" :min="1" :max="40" style="width: 120px" />
      </label>
    </div>

    <u-form :model="formData" :disabled="disabled" :readonly="readonly">
      <u-code-editor
        field="code"
        v-model:lang="lang"
        :langs="['js', 'sql', 'java', 'json']"
        :prefix="showShell ? functionPrefix : undefined"
        :suffix="showShell ? functionSuffix : undefined"
        :dark="dark"
        :default-lines="defaultLines"
        label="代码"
        span="full"
        :rules="{ required: true }"
        @change="handleChange"
      ></u-code-editor>
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
  </div>
</template>

<script lang="ts" setup>
import type { CodeEditorLang } from '@veltra/desktop/types'
import { computed, reactive, ref } from 'vue'

const formData = reactive({ code: '  return a + b' })

const disabled = ref(false)
const readonly = ref(false)
const dark = ref(false)
const showShell = ref(true)
const defaultLines = ref(8)
const lastChange = ref<string>()
const lang = ref<CodeEditorLang>('js')

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
  gap: 16px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.lines-control {
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
