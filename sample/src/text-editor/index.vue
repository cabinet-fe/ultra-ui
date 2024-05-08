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

    export interface TextEditorProps { modelValue?: TextEditorOutputData /**
    高度 */ height?: string width?: string disabled?: boolean }
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'

let modelValue = ref({
  blocks: [
    {
      id: 'QIxEDJ74zX',
      type: 'paragraph',
      data: { text: '<mark class="cdx-marker">123123123</mark>' },
      tunes: { anyTuneName: { alignment: 'left' } }
    },
    {
      id: '7v4U_NnPQK',
      type: 'paragraph',
      data: { text: '123123123' },
      tunes: { anyTuneName: { alignment: 'left' } }
    }
  ]
})

const handleChangeEditor = (value, api, event) => {
  console.log(value, api, event)
}
</script>
<style></style>
