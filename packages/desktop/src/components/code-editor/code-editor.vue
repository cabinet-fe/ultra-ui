<template>
  <u-scroll :class="className" @keyup.enter.stop>
    <div ref="container"></div>
  </u-scroll>
</template>

<script lang="ts" setup>
import { EditorState } from '@codemirror/state'
import { tooltips } from '@codemirror/view'
import { useFormComponent, useFormFallbackProps } from '@ultra-ui/compositions'
import { bem, zIndex } from '@ultra-ui/utils'
import { EditorView, basicSetup } from 'codemirror'
import { computed, onBeforeUnmount, shallowRef, useTemplateRef, watch } from 'vue'

import type { CodeEditorLang, CodeEditorProps } from '../../types'
import { UScroll } from '../scroll'

const props = withDefaults(defineProps<CodeEditorProps>(), {
  disabled: undefined,
  readonly: undefined
})

const model = defineModel<string>()

const cls = bem('code-editor')

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const className = computed<string[]>(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('readonly', readonly.value)
  ]
})

const containerRef = useTemplateRef('container')

const editor = shallowRef<EditorView | null>(null)

const langLoaders: Record<CodeEditorLang, () => Promise<any>> = {
  js: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  java: () => import('@codemirror/lang-java').then((m) => m.java()),
  json: () => import('@codemirror/lang-json').then((m) => m.json())
}

async function renderEditor() {
  if (!containerRef.value) return
  editor.value?.destroy()

  const { language } = props

  const extensions = [
    basicSetup,
    tooltips({
      parent: document.body
    }),
    EditorView.theme({
      '.cm-tooltip': {
        zIndex: zIndex()
      }
    })
  ]

  if (disabled.value) {
    extensions.push(EditorView.editable.of(false))
  }
  if (readonly.value) {
    extensions.push(EditorState.readOnly.of(true))
  }
  if (language) {
    const lang = await langLoaders[language]()

    extensions.push(lang)
  }

  editor.value = new EditorView({
    doc: model.value,
    extensions,
    parent: containerRef.value,

    dispatch(tr) {
      editor.value?.update([tr])
      if (tr.changes.empty || !tr.docChanged) {
        return
      }
      model.value = tr.state.doc.toString()
    }
  })
}

watch([containerRef, () => props.language, disabled, readonly], renderEditor)

watch(
  [() => props.modelValue, editor],
  ([v, e]) => {
    if (!e) return

    if (e.composing || e.state.doc.toJSON().join('\n') === v) {
      return
    }
    const isSelectionOutOfRange = !e?.state.selection.ranges.every(
      (range) => range.anchor < (v?.length ?? 0) && range.head < (v?.length ?? 0)
    )
    e?.dispatch({
      changes: {
        from: 0,
        to: e?.state.doc.length,
        insert: v
      },
      selection: isSelectionOutOfRange ? { anchor: 0, head: 0 } : e?.state.selection,
      scrollIntoView: true
    })
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>
