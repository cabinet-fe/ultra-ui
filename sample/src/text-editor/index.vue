<template>
  <div>
    <div>
      {{ modelValue }}
      <UTextEditor
        v-model="modelValue"
        height="500px"
        @change="handleChangeEditor"
      ></UTextEditor>
    </div>

    export interface TextEditorProps {
      modelValue?: TextEditorOutputData
      /** 高度 */
      height?: string
      width?: string
      disabled?: boolean
    }
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'

let modelValue = ref({
  blocks: [
    {
      id: '0QHrITflqv',
      type: 'paragraph',
      data: {
        text: '123123'
      }
    },
    {
      id: 'BtEbs-4fqc',
      type: 'paragraph',
      data: {
        text: '123321'
      }
    },
    {
      type: 'paragraph',
      data: {
        text: '<b>123123123123</b>'
      }
    }
  ]
})

const handleChangeEditor = (value, api, event) => {
  console.log(value, api, event)
}
</script>
<style></style>
