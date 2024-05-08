<template>
  <div :class="[cls.b, bem.is('disabled', disabled)]">
    <scroll :class="cls.e('scroll')" :style="`height: ${height};`">
      <div :class="cls.e('holder')" id="editor" />
    </scroll>
  </div>
</template>

<script lang="ts" setup>
import type {
  TextEditorProps,
  TextEditorEmits,
  TextEditorOutputData
} from '@ui/types/components/text-editor'
import { bem } from '@ui/utils'
import editorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import RawTool from '@editorjs/raw'
import Checklist from '@editorjs/checklist'
import Table from '@editorjs/table'
import Scroll from '../scroll/scroll.vue'
import Marker from '@editorjs/marker'
import Quote from '@editorjs/quote'
import Paragraph from '@editorjs/paragraph'
import zh from './i18n.json'
import { onMounted, ref } from 'vue'
import AlignmentTuneTool from 'editorjs-text-alignment-blocktune'
import Delimiter from './delimiter'
import Error from './error'
import Underline from './underline'

defineOptions({
  name: 'TextEditor'
})

const emit = defineEmits<TextEditorEmits>()

const props = withDefaults(defineProps<TextEditorProps>(), {
  height: '500px',
  disabled: false,
  placeholder: '请输入'
})

const cls = bem('text-editor')

const editor = ref()

const data = defineModel<TextEditorOutputData>({})

const saveEditor = () => {
  editor.value.save().then((outputData: TextEditorOutputData) => {
    data.value = outputData
  })
}

const readOnly = () => {
  editor.value.readOnly.toggle()
}

onMounted(() => {
  editor.value = new editorJS({
    holder: 'editor',
    tools: {
      header: {
        class: Header,
        config: {
          levels: [1, 2, 3, 4, 5, 6],
          defaultLevel: 1 // 默认标题 // 默认创建的标题
        }
      },
      paragraph: {
        class: Paragraph,
        inlineToolbar: true,
        tunes: ['anyTuneName', 'textColorLine']
      },
      textColorLine: Error,
      delimiter: Delimiter,
      underline: Underline,
      anyTuneName: {
        class: AlignmentTuneTool,
        config: {
          default: 'left',
          blocks: {
            header: 'left',
            list: 'left'
          }
        }
      },
      quote: Quote,
      raw: RawTool,
      list: {
        class: List,
        inlineToolbar: true
      },
      marker: {
        class: Marker,
        inlineToolbar: true
      },
      table: Table,
      checklist: {
        class: Checklist,
        inlineToolbar: true
      }
    },

    data: data.value,

    autofocus: true,

    placeholder: props.placeholder,

    readOnly: props.disabled,

    i18n: {
      messages: zh
    },

    onChange: (api, event) => {
      if (props.disabled) return
      saveEditor()

      emit('change', data.value!, api, event)
    }
  })
})

defineExpose({ saveEditor, readOnly })
</script>
