<template>
  <div>
    <div>
      <u-radio-group
        v-model="language"
        :items="[
          { value: 'js', label: 'js' },
          { value: 'sql', label: 'sql' },
          { value: 'java', label: 'java' }
        ]"
      ></u-radio-group>

      <u-checkbox v-model="disabled">禁用</u-checkbox>
      <u-checkbox v-model="readonly">只读</u-checkbox>
    </div>

    <u-form :model="model" :disabled="disabled" :readonly="readonly">
      <u-code-editor
        field="code"
        :language="language"
        label="代码"
      ></u-code-editor>
    </u-form>

    <pre>{{ model.data.code }}</pre>
  </div>
</template>

<script lang="ts" setup>
import { FormModel } from '@ui/components'
import { ref } from 'vue'

const model = new FormModel({
  code: { required: true }
})

const disabled = ref(false)

const readonly = ref(false)

const language = ref<'js' | 'sql' | 'java'>('js')
</script>
