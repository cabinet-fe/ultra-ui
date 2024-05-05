<template>
  <div :class="cls.b">

    <div id="editorjs" style="width: 300px;height: 300px;">

    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TextEditorProps } from '@ui/types/components/text-editor'
import { bem } from '@ui/utils'

defineOptions({
  name: 'TextEditor'
})

defineProps<TextEditorProps>()

const cls = bem('text-editor')

</script>
