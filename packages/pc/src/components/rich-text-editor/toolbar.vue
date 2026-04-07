<template>
  <div :class="cls.e('toolbar')">
    <template v-for="(item, index) in toolbar" :key="index">
      <div v-if="item === '|'" :class="cls.e('separator')"></div>

      <div v-else-if="item === 'heading'" :class="[cls.e('toolbar-dropdown')]">
        <select
          :class="[cls.e('heading-select'), { 'is-disabled': disabled }]"
          :value="activeHeading"
          :disabled="disabled"
          @change="onHeadingChange"
        >
          <option value="paragraph">正文</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>
      </div>

      <button
        v-else
        type="button"
        :class="[
          cls.e('toolbar-btn'),
          { 'is-active': isActive(item) },
          { 'is-disabled': disabled }
        ]"
        :disabled="disabled"
        :title="getTitle(item)"
        @click="onToolbarAction(item)"
      >
        <span :class="cls.e('toolbar-icon')" v-html="getIcon(item)"></span>
      </button>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount, watch } from 'vue'
import { bem } from '@ultra-ui/core'
import type { ToolbarItem } from '@ultra-ui/pc/types'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  type LexicalEditor,
  $createParagraphNode,
  type RangeSelection
} from 'lexical'
import { $createHeadingNode, $isHeadingNode, type HeadingTagType } from '@lexical/rich-text'
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListNode } from '@lexical/list'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $isQuoteNode, $createQuoteNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getNearestNodeOfType } from '@lexical/utils'

const props = defineProps<{
  editor: LexicalEditor | null
  toolbar: ToolbarItem[]
  disabled: boolean
}>()

const cls = bem('rich-text-editor')

// Active states
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)
const isStrikethrough = ref(false)
const isLink = ref(false)
const isBulletList = ref(false)
const isOrderedList = ref(false)
const isBlockquote = ref(false)
const activeHeading = ref('paragraph')

let cleanupListener: (() => void) | null = null

function setupListener(editorInstance: LexicalEditor) {
  cleanupListener?.()
  cleanupListener = editorInstance.registerUpdateListener(({ editorState }) => {
    editorState.read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      updateToolbarState(selection)
    })
  })
}

function updateToolbarState(selection: RangeSelection) {
  isBold.value = selection.hasFormat('bold')
  isItalic.value = selection.hasFormat('italic')
  isUnderline.value = selection.hasFormat('underline')
  isStrikethrough.value = selection.hasFormat('strikethrough')

  // Check block type
  const anchorNode = selection.anchor.getNode()
  let element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow()

  if ($isHeadingNode(element)) {
    activeHeading.value = element.getTag()
  } else {
    activeHeading.value = 'paragraph'
  }

  // Check list
  const parentList = $getNearestNodeOfType(anchorNode, ListNode)
  if (parentList) {
    const listType = parentList.getListType()
    isBulletList.value = listType === 'bullet'
    isOrderedList.value = listType === 'number'
  } else {
    isBulletList.value = false
    isOrderedList.value = false
  }

  // Check blockquote
  isBlockquote.value = $isQuoteNode(element)

  // Check link
  const parent = anchorNode.getParent()
  isLink.value = $isLinkNode(parent)
}

watch(
  () => props.editor,
  (editorInstance) => {
    if (editorInstance) {
      setupListener(editorInstance)
    }
  },
  { immediate: true }
)

function isActive(item: ToolbarItem): boolean {
  switch (item) {
    case 'bold':
      return isBold.value
    case 'italic':
      return isItalic.value
    case 'underline':
      return isUnderline.value
    case 'strikethrough':
      return isStrikethrough.value
    case 'bullet-list':
      return isBulletList.value
    case 'ordered-list':
      return isOrderedList.value
    case 'blockquote':
      return isBlockquote.value
    case 'link':
      return isLink.value
    default:
      return false
  }
}

function onToolbarAction(item: ToolbarItem) {
  const editorInstance = props.editor
  if (!editorInstance || props.disabled) return

  switch (item) {
    case 'bold':
      editorInstance.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
      break
    case 'italic':
      editorInstance.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
      break
    case 'underline':
      editorInstance.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
      break
    case 'strikethrough':
      editorInstance.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
      break
    case 'code':
      editorInstance.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
      break
    case 'bullet-list':
      editorInstance.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
      break
    case 'ordered-list':
      editorInstance.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
      break
    case 'blockquote':
      editorInstance.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          if (isBlockquote.value) {
            $setBlocksType(selection, () => $createParagraphNode())
          } else {
            $setBlocksType(selection, () => $createQuoteNode())
          }
        }
      })
      break
    case 'link':
      toggleLink(editorInstance)
      break
    case 'undo':
      editorInstance.dispatchCommand(UNDO_COMMAND, undefined)
      break
    case 'redo':
      editorInstance.dispatchCommand(REDO_COMMAND, undefined)
      break
  }

  // Keep focus on editor
  editorInstance.focus()
}

function onHeadingChange(event: Event) {
  const editorInstance = props.editor
  if (!editorInstance || props.disabled) return

  const value = (event.target as HTMLSelectElement).value

  editorInstance.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      if (value === 'paragraph') {
        $setBlocksType(selection, () => $createParagraphNode())
      } else {
        $setBlocksType(selection, () => $createHeadingNode(value as HeadingTagType))
      }
    }
  })

  editorInstance.focus()
}

function toggleLink(editorInstance: LexicalEditor) {
  editorInstance.getEditorState().read(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    const anchorNode = selection.anchor.getNode()
    const parent = anchorNode.getParent()

    if ($isLinkNode(parent)) {
      // Remove link
      editorInstance.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    } else {
      // Insert link with prompt
      const url = prompt('请输入链接地址:', 'https://')
      if (url && url !== 'https://') {
        editorInstance.dispatchCommand(TOGGLE_LINK_COMMAND, url)
      }
    }
  })
}

function getTitle(item: ToolbarItem): string {
  const titles: Record<string, string> = {
    bold: '加粗',
    italic: '斜体',
    underline: '下划线',
    strikethrough: '删除线',
    code: '行内代码',
    'bullet-list': '无序列表',
    'ordered-list': '有序列表',
    blockquote: '引用',
    'code-block': '代码块',
    link: '链接',
    undo: '撤销',
    redo: '重做'
  }
  return titles[item] ?? item
}

function getIcon(item: ToolbarItem): string {
  const icons: Record<string, string> = {
    bold: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>',
    italic:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>',
    underline:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>',
    strikethrough:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>',
    code: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    'bullet-list':
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    'ordered-list':
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>',
    blockquote:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>',
    'code-block':
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="m8 10-3 2 3 2"/><path d="m16 10 3 2-3 2"/><path d="m13 7-2 10"/></svg>',
    link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    undo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>',
    redo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>'
  }
  return icons[item] ?? ''
}

onBeforeUnmount(() => {
  cleanupListener?.()
  cleanupListener = null
})
</script>
