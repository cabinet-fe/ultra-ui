<template>
  <div :class="className">
    <toolbar
      v-if="!isReadonly && toolbarItems.length > 0"
      :editor="editor"
      :toolbar="toolbarItems"
      :disabled="isDisabled"
    />
    <div :class="cls.e('content')">
      <div
        ref="editorContainer"
        :class="cls.e('editable')"
        :contenteditable="!isDisabled && !isReadonly"
      ></div>
      <div v-if="showPlaceholder" :class="cls.e('placeholder')">
        {{ placeholder }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import type { ToolbarItem } from '../../types'

const LEXICAL_THEME = {
  paragraph: 'u-rte-paragraph',
  heading: {
    h1: 'u-rte-h1',
    h2: 'u-rte-h2',
    h3: 'u-rte-h3',
    h4: 'u-rte-h4',
    h5: 'u-rte-h5',
    h6: 'u-rte-h6'
  },
  text: {
    bold: 'u-rte-bold',
    italic: 'u-rte-italic',
    underline: 'u-rte-underline',
    strikethrough: 'u-rte-strikethrough'
  },
  list: {
    ul: 'u-rte-ul',
    ol: 'u-rte-ol',
    listitem: 'u-rte-li',
    nested: { listitem: 'u-rte-li--nested' }
  },
  quote: 'u-rte-blockquote',

  link: 'u-rte-link',
  image: 'u-rte-image'
}

const DEFAULT_TOOLBAR: ToolbarItem[] = [
  'undo',
  'redo',
  '|',
  'heading',
  '|',
  'bold',
  'italic',
  'underline',
  'strikethrough',
  '|',
  'bullet-list',
  'ordered-list',
  '|',
  'blockquote',
  '|',
  'link'
]
</script>

<script lang="ts" setup>
import { registerHistory, createEmptyHistoryState } from '@lexical/history'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { ListNode, ListItemNode, registerList } from '@lexical/list'
import { registerRichText } from '@lexical/rich-text'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { useFormComponent, useFormFallbackProps } from '@ultra-ui/compositions'
import { bem } from '@ultra-ui/utils'
import { createEditor, $getRoot, $createParagraphNode, type LexicalEditor } from 'lexical'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'

import type { RichTextEditorProps } from '../../types'
import Toolbar from './toolbar.vue'

const props = withDefaults(defineProps<RichTextEditorProps>(), {
  disabled: undefined,
  readonly: undefined,
  format: 'html',
  toolbar: () => DEFAULT_TOOLBAR,
  placeholder: ''
})

const model = defineModel<string>()

const cls = bem('rich-text-editor')

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const isDisabled = computed(() => !!disabled.value)
const isReadonly = computed(() => !!readonly.value)

const className = computed<string[]>(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', isDisabled.value),
    bem.is('readonly', isReadonly.value)
  ]
})

const toolbarItems = computed<ToolbarItem[]>(() => {
  return props.toolbar ?? DEFAULT_TOOLBAR
})

const editorContainer = useTemplateRef('editorContainer')
const editor = shallowRef<LexicalEditor | null>(null)
const showPlaceholder = ref(true)
let isComposing = false
let cleanupFns: (() => void)[] = []

function initEditor() {
  if (!editorContainer.value) return

  const editorInstance = createEditor({
    namespace: 'URichTextEditor',
    theme: LEXICAL_THEME,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
    editable: !isDisabled.value && !isReadonly.value,
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    }
  })

  editorInstance.setRootElement(editorContainer.value)

  // Register plugins
  cleanupFns.push(registerRichText(editorInstance))
  cleanupFns.push(registerList(editorInstance))
  cleanupFns.push(registerHistory(editorInstance, createEmptyHistoryState(), 300))

  // Set initial value
  if (model.value) {
    setEditorContent(editorInstance, model.value)
  }

  // Listen for content changes
  cleanupFns.push(
    editorInstance.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot()
        const textContent = root.getTextContent()
        showPlaceholder.value = textContent.trim().length === 0

        if (isComposing) return

        let value: string
        if (props.format === 'json') {
          value = JSON.stringify(editorState.toJSON())
        } else {
          value = $generateHtmlFromNodes(editorInstance)
        }

        // Avoid circular updates: only emit if content really changed
        if (value !== model.value) {
          isComposing = true
          model.value = value
          // Use microtask to reset after Vue processes the update
          queueMicrotask(() => {
            isComposing = false
          })
        }
      })
    })
  )

  // Composing event listeners for IME
  const rootElement = editorInstance.getRootElement()
  if (rootElement) {
    const onCompositionStart = () => {
      isComposing = true
    }
    const onCompositionEnd = () => {
      isComposing = false
    }
    rootElement.addEventListener('compositionstart', onCompositionStart)
    rootElement.addEventListener('compositionend', onCompositionEnd)
    cleanupFns.push(() => {
      rootElement.removeEventListener('compositionstart', onCompositionStart)
      rootElement.removeEventListener('compositionend', onCompositionEnd)
    })
  }

  editor.value = editorInstance
}

function setEditorContent(editorInstance: LexicalEditor, value: string) {
  editorInstance.update(() => {
    const root = $getRoot()
    root.clear()

    if (props.format === 'json') {
      try {
        const parsedState = editorInstance.parseEditorState(value)
        editorInstance.setEditorState(parsedState)
      } catch {
        // If JSON parse fails, treat as empty
        root.append($createParagraphNode())
      }
    } else {
      // HTML format
      const parser = new DOMParser()
      const dom = parser.parseFromString(value, 'text/html')
      const nodes = $generateNodesFromDOM(editorInstance, dom)
      root.append(...nodes)
    }
  })
}

// Watch external model changes
watch(model, (newVal) => {
  if (!editor.value || isComposing) return

  const editorInstance = editor.value

  // Compare current content to avoid circular updates
  editorInstance.getEditorState().read(() => {
    let currentValue: string
    if (props.format === 'json') {
      currentValue = JSON.stringify(editorInstance.getEditorState().toJSON())
    } else {
      currentValue = $generateHtmlFromNodes(editorInstance)
    }

    if (currentValue !== newVal) {
      isComposing = true
      setEditorContent(editorInstance, newVal ?? '')
      queueMicrotask(() => {
        isComposing = false
      })
    }
  })
})

// Watch disabled/readonly changes
watch([isDisabled, isReadonly], () => {
  if (editor.value) {
    editor.value.setEditable(!isDisabled.value && !isReadonly.value)
  }
})

onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  cleanupFns.forEach((fn) => fn())
  cleanupFns = []
  editor.value = null
})
</script>
