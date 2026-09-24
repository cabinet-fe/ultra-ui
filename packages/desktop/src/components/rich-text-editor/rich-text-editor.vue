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
  'link',
  '|',
  'image'
]
</script>

<script lang="ts" setup>
import { registerHistory, createEmptyHistoryState } from '@lexical/history'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { ListNode, ListItemNode, registerList } from '@lexical/list'
import { registerRichText } from '@lexical/rich-text'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { useFormFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import {
  $createRangeSelection,
  $getNodeByKey,
  $getRoot,
  $createParagraphNode,
  $nodesOfType,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  DROP_COMMAND,
  PASTE_COMMAND,
  createEditor,
  type LexicalEditor
} from 'lexical'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'

import type {
  RichTextEditorProps,
  RichTextImageUploader,
  _RichTextEditorExposed
} from '../../types'
import {
  ImageNode,
  $isImageNode,
  gcImageObjectUrls,
  insertImageFiles,
  revokeImageObjectUrls
} from './image-node'
import Toolbar from './toolbar.vue'
import { useImageResize } from './use-image-resize'

const props = withDefaults(defineProps<RichTextEditorProps>(), {
  disabled: undefined,
  readonly: undefined,
  format: 'html',
  toolbar: () => DEFAULT_TOOLBAR,
  placeholder: '',
  image: true
})

const model = defineModel<string>()

const cls = bem('rich-text-editor')

const { formProps } = injectFormContext()

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
  const items = props.toolbar ?? DEFAULT_TOOLBAR
  return props.image ? items : items.filter((item) => item !== 'image')
})

const editorContainer = useTemplateRef('editorContainer')
const editor = shallowRef<LexicalEditor | null>(null)
const showPlaceholder = ref(true)
let isComposing = false
let cleanupFns: (() => void)[] = []

const acceptsImage = () => props.image && !isDisabled.value && !isReadonly.value

// 图片选中 / 拖拽缩放交互
useImageResize(editor, acceptsImage)

function initEditor() {
  if (!editorContainer.value) return

  const editorInstance = createEditor({
    namespace: 'URichTextEditor',
    theme: LEXICAL_THEME,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, ImageNode],
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

  // Image input: paste & drop
  cleanupFns.push(
    editorInstance.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!acceptsImage()) return false
        if (insertImageFiles(editorInstance, event.clipboardData?.files ?? []) > 0) {
          event.preventDefault()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_HIGH
    ),
    editorInstance.registerCommand(
      DROP_COMMAND,
      (event) => {
        if (!acceptsImage()) return false
        const files = event.dataTransfer?.files
        if (!files?.length) return false
        // 先把光标落到落点，再插入
        const range = document.caretRangeFromPoint(event.clientX, event.clientY)
        if (range) {
          editorInstance.update(() => {
            const selection = $createRangeSelection()
            selection.applyDOMRange(range)
            $setSelection(selection)
          })
        }
        if (insertImageFiles(editorInstance, files) > 0) {
          event.preventDefault()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_HIGH
    )
  )

  // Set initial value
  if (model.value) {
    setEditorContent(editorInstance, model.value)
  }

  // Listen for content changes
  cleanupFns.push(
    editorInstance.registerUpdateListener(({ editorState }) => {
      editorState.read(
        () => {
          const root = $getRoot()
          const imageNodes = $nodesOfType(ImageNode)
          showPlaceholder.value =
            root.getTextContent().trim().length === 0 && imageNodes.length === 0

          // 回收已从内容中移除的图片 objectURL
          gcImageObjectUrls(editorInstance, new Set(imageNodes.map((node) => node.getSrc())))

          if (isComposing) return

          const value = serializeContent(editorInstance)

          // Avoid circular updates: only emit if content really changed
          if (value !== model.value) {
            isComposing = true
            model.value = value
            // Use microtask to reset after Vue processes the update
            queueMicrotask(() => {
              isComposing = false
            })
          }
        },
        { editor: editorInstance }
      )
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

function serializeContent(editorInstance: LexicalEditor): string {
  return editorInstance.read(() =>
    props.format === 'json'
      ? JSON.stringify(editorInstance.getEditorState().toJSON())
      : $generateHtmlFromNodes(editorInstance)
  )
}

let isUploadingImages = false

async function uploadImages(upload: RichTextImageUploader): Promise<string> {
  const editorInstance = editor.value
  if (!editorInstance) return model.value ?? ''
  if (isUploadingImages) throw new Error('图片正在上传中')

  const pending = editorInstance.getEditorState().read(() =>
    $nodesOfType(ImageNode)
      .filter((node) => node.getFile())
      .map((node) => ({ key: node.getKey(), file: node.getFile() as File }))
  )

  if (pending.length) {
    isUploadingImages = true
    try {
      const urls = await Promise.all(pending.map(({ file }) => upload(file)))
      editorInstance.update(() => {
        pending.forEach(({ key }, index) => {
          const node = $getNodeByKey(key)
          if ($isImageNode(node)) node.setSrc(urls[index])
        })
      })
    } finally {
      isUploadingImages = false
    }
  }

  return serializeContent(editorInstance)
}

defineExpose<_RichTextEditorExposed>({ uploadImages })

// Watch external model changes
watch(model, (newVal) => {
  if (!editor.value || isComposing) return

  const editorInstance = editor.value

  // Compare current content to avoid circular updates
  const currentValue = serializeContent(editorInstance)

  if (currentValue !== newVal) {
    isComposing = true
    setEditorContent(editorInstance, newVal ?? '')
    queueMicrotask(() => {
      isComposing = false
    })
  }
})

// Watch disabled/readonly changes
watch([isDisabled, isReadonly], () => {
  if (!editor.value) return
  editor.value.setEditable(!isDisabled.value && !isReadonly.value)
  if (isDisabled.value || isReadonly.value) {
    // 切出可编辑态时取消可能残留的图片选中
    editor.value.update(() => {
      if ($isNodeSelection($getSelection())) $setSelection(null)
    })
  }
})

onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  cleanupFns.forEach((fn) => fn())
  cleanupFns = []
  if (editor.value) revokeImageObjectUrls(editor.value)
  editor.value = null
})
</script>
