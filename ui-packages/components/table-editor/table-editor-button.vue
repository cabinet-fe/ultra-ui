<template>
  <div :class="cls.b" @click="onCreateData">
    <slot />
  </div>
</template>
<script lang="ts" setup>
import { bem } from '@ui/utils'
import type { tableEditorType } from './table-editor.type'

const cls = bem('table-editor-button')

const emit = defineEmits<tableEditorType>()

/** 点击事件 */
const onCreateData = () => {
  emit('click')
}
</script>
