<template>
  <u-scroll :class="className" :style="rootStyle" @keyup.enter.stop>
    <div ref="container"></div>

    <u-select
      v-if="showLangSelect"
      :class="cls.e('lang-select')"
      v-model="lang"
      size="small"
      :options="langOptions"
      :clearable="false"
      :disabled="disabled"
    />
  </u-scroll>
</template>

<script lang="ts" setup>
import { Compartment, EditorState, type Extension, type Text } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, tooltips } from '@codemirror/view'
import { useFormFallbackProps } from '@veltra/compositions'
import { bem, injectFormContext, zIndex } from '@veltra/utils'
import {
  computed,
  onBeforeUnmount,
  shallowRef,
  useTemplateRef,
  watch,
  type CSSProperties
} from 'vue'

import type { CodeEditorEmits, CodeEditorLang, CodeEditorProps } from '../../types'
import { UScroll } from '../scroll'
import { USelect } from '../select'
import { basicSetup } from './basic-setup'
import { loadLanguage } from './lang-loaders'
import {
  buildFullDoc,
  extractBodyFromText,
  getShellRanges,
  mapSelectionToBody,
  shellExtension,
  textEqualsShellDoc,
  type ShellConfig
} from './shell-extension'

defineOptions({ name: 'UCodeEditor' })

const props = withDefaults(defineProps<CodeEditorProps>(), {
  disabled: undefined,
  readonly: undefined,
  dark: false,
  defaultLines: 8
})

const emit = defineEmits<CodeEditorEmits>()

const model = defineModel<string>()
const lang = defineModel<CodeEditorLang>('lang')

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

const langs = computed(() => props.langs ?? [])

const showLangSelect = computed(() => langs.value.length > 1)

const langOptions = computed(() =>
  langs.value.map((value) => ({ label: value.toUpperCase(), value }))
)

/** 实际生效的语言：优先 lang model，否则回落 langs[0] */
const activeLang = computed<CodeEditorLang | undefined>(() => lang.value ?? langs.value[0])

const shellConfig = computed<ShellConfig>(() => ({
  prefix: props.prefix ?? '',
  suffix: props.suffix ?? ''
}))

const containerRef = useTemplateRef('container')
const editor = shallowRef<EditorView | null>(null)

const themeCompartment = new Compartment()
const editableCompartment = new Compartment()
const readOnlyCompartment = new Compartment()
const langCompartment = new Compartment()
const shellCompartment = new Compartment()

/** 聚焦时的正文快照，用于失焦时判断是否触发 change */
let focusSnapshot = ''

/**
 * 编辑器最近一次写出的正文引用。
 * 用于短路 model → doc 同步，避免每次按键对整篇文档做 O(n) 相等比较。
 */
let lastEditorBody: string | undefined

/** 上一帧是否处于 IME composition，用于在 composition 结束时补一次 model 同步 */
let wasComposing = false

/** 将编辑器正文写回 v-model（跳过与上次相同的值，避免多余更新） */
function writeModelFromDoc(doc: Text) {
  const nextBody = extractBodyFromText(doc, shellConfig.value)
  if (nextBody === lastEditorBody && nextBody === model.value) return
  lastEditorBody = nextBody
  model.value = nextBody
}

function buildExtensions(): Extension[] {
  return [
    basicSetup,
    tooltips({ parent: document.body }),
    EditorView.theme({ '.cm-tooltip': { zIndex: zIndex() } }),
    themeCompartment.of(props.dark ? oneDark : []),
    editableCompartment.of(EditorView.editable.of(!disabled.value)),
    readOnlyCompartment.of(EditorState.readOnly.of(readonly.value)),
    langCompartment.of([]),
    shellCompartment.of(shellExtension(shellConfig.value)),
    EditorView.updateListener.of((update) => {
      const composing = update.view.composing

      // IME 进行中不写回，避免中间态触发父级重渲染；结束后再统一同步
      if (update.docChanged && !composing) {
        writeModelFromDoc(update.state.doc)
      } else if (wasComposing && !composing) {
        writeModelFromDoc(update.state.doc)
      }
      wasComposing = composing

      if (!update.focusChanged) return
      if (update.view.hasFocus) {
        focusSnapshot = extractBodyFromText(update.state.doc, shellConfig.value)
        return
      }
      const current = extractBodyFromText(update.state.doc, shellConfig.value)
      if (current !== focusSnapshot) {
        emit('change', current)
      }
    })
  ]
}

let editorToken = 0
let langToken = 0

async function applyLanguage() {
  const view = editor.value
  if (!view) return
  const myToken = ++langToken
  const language = activeLang.value

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
  lastEditorBody = undefined
  wasComposing = false
}

function createEditor() {
  destroyEditor()
  const myToken = ++editorToken
  const parent = containerRef.value
  if (!parent) return

  const config = shellConfig.value
  const body = model.value ?? ''
  const doc = buildFullDoc(body, config)
  const { bodyStart } = getShellRanges(doc.length, config)
  lastEditorBody = body

  const view = new EditorView({
    doc,
    selection: { anchor: bodyStart, head: bodyStart },
    extensions: buildExtensions(),
    parent
  })

  if (myToken !== editorToken) {
    view.destroy()
    return
  }

  editor.value = view
  applyLanguage()
}

/**
 * 将 model 正文同步为完整文档；可选同时 reconfigure shell，
 * 避免 prefix/suffix 变更时「先改扩展、后改文档」导致选区越界。
 */
function syncDocFromModel(
  view: EditorView,
  body: string,
  config: ShellConfig,
  options?: { reconfigureShell?: boolean; prevShell?: ShellConfig }
) {
  const current = view.state.doc
  const docChanged = !textEqualsShellDoc(current, body, config)
  const reconfigureShell = options?.reconfigureShell ?? false

  if (!docChanged && !reconfigureShell) return

  const nextDoc = buildFullDoc(body, config)
  const prevShell = options?.prevShell ?? config
  const prevRanges = getShellRanges(current.length, prevShell)
  const nextRanges = getShellRanges(nextDoc.length, config)
  const selection = mapSelectionToBody(view.state.selection, prevRanges, nextRanges, nextDoc.length)

  view.dispatch({
    ...(docChanged
      ? {
          changes: { from: 0, to: current.length, insert: nextDoc },
          selection,
          // 仅外壳变更时滚入视口；外部 model 回写不应打断用户滚动位置
          ...(reconfigureShell ? { scrollIntoView: true } : {})
        }
      : { selection }),
    ...(reconfigureShell ? { effects: shellCompartment.reconfigure(shellExtension(config)) } : {}),
    // 绕过 shell 的 change/transactionFilter，避免全量替换被拦截或选区被错误钳制
    filter: false
  })
}

watch(
  containerRef,
  (el) => {
    if (el) createEditor()
    else destroyEditor()
  },
  { immediate: true, flush: 'post' }
)

watch(activeLang, applyLanguage)

/** langs 变化时，若当前 lang 未设或不在列表中则纠正为 langs[0] */
watch(
  langs,
  (list) => {
    if (!list.length) return
    if (!lang.value || !list.includes(lang.value)) {
      lang.value = list[0]
    }
  },
  { immediate: true }
)

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

watch(
  [model, editor, shellConfig],
  ([v, e], [, , prevShell]) => {
    if (!e) return
    // IME 组字中不接受外部回写，避免打断输入
    if (e.composing) return
    const config = shellConfig.value
    const shellChanged =
      !prevShell || prevShell.prefix !== config.prefix || prevShell.suffix !== config.suffix
    // 编辑器自身写出的 model 无需回写文档
    if (!shellChanged && v === lastEditorBody) return
    const body = v ?? ''
    syncDocFromModel(e, body, config, {
      reconfigureShell: shellChanged,
      prevShell: prevShell ?? config
    })
    lastEditorBody = body
  },
  { immediate: true }
)

onBeforeUnmount(destroyEditor)
</script>
