<template>
  <div class="page">
    <div class="toolbar">
      <u-radio-group
        v-model="language"
        :items="[
          { value: 'js', label: 'js' },
          { value: 'sql', label: 'sql' },
          { value: 'java', label: 'java' },
          { value: 'json', label: 'json' }
        ]"
      ></u-radio-group>

      <u-checkbox v-model="disabled">禁用</u-checkbox>
      <u-checkbox v-model="readonly">只读</u-checkbox>
      <u-checkbox v-model="dark">暗色</u-checkbox>

      <label class="lines-control">
        <span>默认行数</span>
        <u-number-input v-model="defaultLines" :min="1" :max="40" style="width: 120px" />
      </label>
    </div>

    <u-form :model="formData" :disabled="disabled" :readonly="readonly">
      <u-code-editor
        field="code"
        :language="language"
        :dark="dark"
        :default-lines="defaultLines"
        label="代码"
        span="full"
        :rules="{ required: true }"
      ></u-code-editor>
    </u-form>

    <pre class="preview">{{ formData.code }}</pre>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

const formData = reactive({ code: '' })

const disabled = ref(false)
const readonly = ref(false)
const dark = ref(false)
const defaultLines = ref(8)

const language = ref<'js' | 'sql' | 'java' | 'json'>('js')
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

.preview {
  margin: 0;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
