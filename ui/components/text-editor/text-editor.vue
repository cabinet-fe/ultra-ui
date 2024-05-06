<template>
  <div :class="cls.b" id="editor">
    <!-- <div ></div> -->
  </div>
</template>

<script lang="ts" setup>
import type { TextEditorProps } from '@ui/types/components/text-editor'
import { bem } from '@ui/utils'
import editorJS from '@editorjs/editorjs'
import Header from '@editorjs/header';
import List from '@editorjs/list';
import RawTool from '@editorjs/raw'
import { onMounted, ref } from 'vue';
import zh from './i18n.json'

defineOptions({
  name: 'TextEditor'
})

defineProps<TextEditorProps>()

const cls = bem('text-editor')


const editor = ref()

// const editorRef = shallowRef<InnerHTML>()

const saveEditor = () => {
  editor.value.save().then((outputData) => {
    console.log(outputData)
  }).catch((error) => {
    console.log(error)
  });
}

onMounted(() => {
  editor.value = new editorJS({
    holder: 'editor',
    tools: {
      header: {
        class: Header,
        config: {
          defaultLevel: 1, // 默认标题 // 默认创建的标题
        },
      },
      raw: RawTool,
      list: List
    },
    autofocus: true,
    i18n: {
      messages: zh
    },

    onReady: () => {
      console.log('Editor')
    },
    onChange: (api, event) => {
      console.log(api, event)
    }
  })
})

defineExpose({ saveEditor })
</script>
