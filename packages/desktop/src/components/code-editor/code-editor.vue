<template>
  <u-scroll :class="className" :style="rootStyle" @keyup.enter.stop>
    <div ref="container"></div>
  </u-scroll>
</template>

<script lang="ts" setup>
import { Compartment, EditorState, type Extension } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, ViewPlugin, tooltips, type ViewUpdate } from '@codemirror/view'
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, zIndex } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  useTemplateRef,
  watch,
  type CSSProperties
} from 'vue'

import type { CodeEditorProps } from '../../types'
import { UScroll } from '../scroll'
import { basicSetup } from './basic-setup'
import { loadLanguage } from './lang-loaders'

defineOptions({ name: 'UCodeEditor' })

const props = withDefaults(defineProps<CodeEditorProps>(), {
  disabled: undefined,
  readonly: undefined,
  dark: false,
  defaultLines: 8
})

const model = defineModel<string>()

const cls = bem('code-editor')

const { formProps } = injectFormContext()

const { disabled, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  disabled: false,
  readonly: false
})

const className = computed<string[]>(() => [
  cls.b,
  bem.is('disabled', disabled.value),
  bem.is('readonly', readonly.value),
  bem.is('dark', props.dark)
])

const rootStyle = computed<CSSProperties>(() => ({
  '--u-code-editor-default-lines': Math.max(1, props.defaultLines)
}))

const containerRef = useTemplateRef('container')
const editor = shallowRef<EditorView | null>(null)

const themeCompartment = new Compartment()
const editableCompartment = new Compartment()
const readOnlyCompartment = new Compartment()
const langCompartment = new Compartment()

let phantomGutter: HTMLElement | null = null
let phantomContainer: HTMLElement | null = null
let lastPhantomKey = ''

function resetPhantomCache() {
  phantomGutter = null
  phantomContainer = null
  lastPhantomKey = ''
}

/**
 * 在 .cm-lineNumbers 末尾追加占位行号 DOM，使可视行号数量补齐到 defaultLines。
 * CodeMirror 的 lineNumbers() 仅为真实文档行渲染行号，超出部分由本逻辑补全。
 */
function syncPhantomLineNumbers() {
  const view = editor.value
  if (!view) return

  if (!phantomGutter || !phantomGutter.isConnected) {
    phantomGutter = view.dom.querySelector<HTMLElement>('.cm-gutter.cm-lineNumbers')
  }
  if (!phantomGutter) return

  if (!phantomContainer) {
    phantomContainer = document.createElement('div')
    phantomContainer.className = 'cm-phantom-lines'
  }
  if (
    phantomContainer.parentElement !== phantomGutter ||
    phantomContainer !== phantomGutter.lastElementChild
  ) {
    phantomGutter.appendChild(phantomContainer)
  }

  const realLines = view.state.doc.lines
  const target = Math.max(0, Math.max(1, props.defaultLines) - realLines)
  const lineHeight = view.defaultLineHeight

  const key = `${realLines}|${target}|${lineHeight}`
  if (key === lastPhantomKey) return
  lastPhantomKey = key

  while (phantomContainer.children.length > target) {
    phantomContainer.lastElementChild!.remove()
  }
  while (phantomContainer.children.length < target) {
    const el = document.createElement('div')
    el.className = 'cm-gutterElement cm-gutterElement-phantom'
    phantomContainer.appendChild(el)
  }
  for (let i = 0; i < target; i++) {
    const el = phantomContainer.children[i] as HTMLElement
    const num = String(realLines + i + 1)
    if (el.textContent !== num) el.textContent = num
    if (lineHeight && el.style.height !== `${lineHeight}px`) {
      el.style.height = `${lineHeight}px`
    }
  }
}

const phantomLineNumbersPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      if (update.docChanged || update.geometryChanged) {
        syncPhantomLineNumbers()
      }
    }
  }
)

function buildExtensions(): Extension[] {
  return [
    basicSetup,
    tooltips({ parent: document.body }),
    EditorView.theme({ '.cm-tooltip': { zIndex: zIndex() } }),
    themeCompartment.of(props.dark ? oneDark : []),
    editableCompartment.of(EditorView.editable.of(!disabled.value)),
    readOnlyCompartment.of(EditorState.readOnly.of(readonly.value)),
    langCompartment.of([]),
    phantomLineNumbersPlugin
  ]
}

let editorToken = 0
let langToken = 0

async function applyLanguage() {
  const view = editor.value
  if (!view) return
  const myToken = ++langToken
  const { language } = props

  if (!language) {
    if (myToken !== langToken || editor.value !== view) return
    view.dispatch({ effects: langCompartment.reconfigure([]) })
    return
  }

  const ext = await loadLanguage(language)
  if (myToken !== langToken || editor.value !== view) return
  view.dispatch({ effects: langCompartment.reconfigure(ext) })
}

function destroyEditor() {
  ++editorToken
  ++langToken
  editor.value?.destroy()
  editor.value = null
  resetPhantomCache()
}

function createEditor() {
  destroyEditor()
  const myToken = ++editorToken
  const parent = containerRef.value
  if (!parent) return

  const view = new EditorView({
    doc: model.value,
    extensions: buildExtensions(),
    parent,
    dispatch(tr) {
      view.update([tr])
      if (tr.docChanged) {
        model.value = tr.state.doc.toString()
      }
    }
  })

  if (myToken !== editorToken) {
    view.destroy()
    return
  }

  editor.value = view
  syncPhantomLineNumbers()
  applyLanguage()
}

watch(
  containerRef,
  (el) => {
    if (el) createEditor()
    else destroyEditor()
  },
  { immediate: true, flush: 'post' }
)

watch(() => props.language, applyLanguage)

watch(
  () => props.dark,
  (dark) => {
    editor.value?.dispatch({ effects: themeCompartment.reconfigure(dark ? oneDark : []) })
  }
)

watch(disabled, (v) => {
  editor.value?.dispatch({ effects: editableCompartment.reconfigure(EditorView.editable.of(!v)) })
})

watch(readonly, (v) => {
  editor.value?.dispatch({ effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(v)) })
})

watch(() => props.defaultLines, syncPhantomLineNumbers)

watch(
  [() => props.modelValue, editor],
  ([v, e]) => {
    if (!e) return
    if (e.composing) return
    const next = v ?? ''
    if (e.state.doc.toString() === next) return

    const valueLength = next.length
    const inRange = e.state.selection.ranges.every(
      (range) => range.anchor <= valueLength && range.head <= valueLength
    )
    e.dispatch({
      changes: { from: 0, to: e.state.doc.length, insert: next },
      selection: inRange ? e.state.selection : { anchor: 0, head: 0 },
      scrollIntoView: true
    })
  },
  { immediate: true }
)

onBeforeUnmount(destroyEditor)
</script>
