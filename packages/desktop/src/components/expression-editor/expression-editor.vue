<template>
  <div ref="rootEl" :class="cls.b">
    <!-- 提示行独立在边框盒（shell）之外 -->
    <div v-if="showHint" :class="cls.e('hint')">输入 <kbd>@</kbd> 唤起变量面板</div>

    <div :class="shellClass">
      <div :class="cls.e('body')">
        <div
          ref="container"
          :class="cls.e('container')"
          :contenteditable="!readonly && !disabled"
          :data-empty="visualEmpty || undefined"
          :data-placeholder="props.placeholder"
          @keydown="onKeydown"
          @blur="onBlur"
        ></div>

        <div v-if="showPlaceholder" :class="cls.e('placeholder')">
          {{ props.placeholder }}
        </div>
      </div>

      <!-- mention 面板的定位锚点：跟随 `@` 字符位置（见 positionMentionAnchor） -->
      <span ref="mentionAnchor" :class="cls.e('mention-anchor')" aria-hidden="true"></span>
    </div>

    <VariablePicker
      ref="pickerRef"
      :visible="pickerVisible"
      :trigger-dom="pickerTriggerDom"
      :variables="props.variables"
      :filter="pickerFilter"
      :selectable-levels="props.selectableLevels ?? 'leaf'"
      @select="onPickerSelect"
      @dismiss="onPickerDismiss"
      @update:visible="onPickerVisibleChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useTemplateRef,
  watch
} from 'vue'

import type { ExpressionEditorProps, VariableItem } from '../../types'
import VariablePicker from './components/variable-picker.vue'
import { createEditor, type EditorAPI } from './core/editor'
import { createMention, type MentionAPI } from './core/mention'
import { parse, type Doc } from './core/model'
import { createVariableMap } from './di'

defineOptions({ name: 'UExpressionEditor' })

const props = withDefaults(defineProps<ExpressionEditorProps>(), {
  placeholder: '请输入表达式，输入 @ 可插入变量',
  selectableLevels: 'leaf',
  // Boolean prop 缺省会被 Vue 归一成 false，挡住 UForm 下发的 disabled / readonly，须显式留 undefined
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const cls = bem('expression-editor')
const { formProps } = injectFormContext()
const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const containerRef = useTemplateRef<HTMLDivElement>('container')
const rootElRef = useTemplateRef<HTMLDivElement>('rootEl')
const mentionAnchorRef = useTemplateRef<HTMLSpanElement>('mentionAnchor')
const pickerRef = useTemplateRef<{ handleKeydown: (e: KeyboardEvent) => boolean }>('pickerRef')

/** 视觉盒（边框 / 背景 / 聚焦光晕 / 尺寸态）挂在 shell 上，根节点只做布局 */
const shellClass = computed(() => [
  cls.e('shell'),
  cls.em('shell', size.value),
  bem.is('disabled', disabled.value),
  bem.is('readonly', readonly.value)
])

const variableMap = computed(() => createVariableMap(props.variables))

const editorRef = shallowRef<EditorAPI | null>(null)
const mention: MentionAPI = createMention()

const currentDoc = shallowRef<Doc>([])
/** 框内视觉空态：与 IME 合成状态无关，由 editor 在 DOM 变化时上报 */
const visualEmpty = shallowRef(true)
const showPlaceholder = computed(() => visualEmpty.value && !disabled.value)
/** 上方 `@` 使用提示常驻：只跟可编辑状态走，不随内容增减隐藏 */
const showHint = computed(() => !disabled.value && !readonly.value)

const pickerMode = shallowRef<'mention' | 'reselect' | null>(null)
const pickerTriggerDom = shallowRef<HTMLElement | undefined>(undefined)
const reselectingSegIdx = shallowRef<number | null>(null)
const pickerFilter = shallowRef('')

const pickerVisible = computed(() => pickerMode.value !== null)

/** 把 mention 锚点移到 `@` 字符下方，面板据此定位 */
function positionMentionAnchor(anchorOffset: number) {
  const rootEl = rootElRef.value
  const anchor = mentionAnchorRef.value
  const rect = editorRef.value?.getRectAtOffset(anchorOffset)
  if (!rootEl || !anchor || !rect) return
  // absolute 定位以 padding box 为基准，需扣除根节点边框宽度
  const rootRect = rootEl.getBoundingClientRect()
  anchor.style.left = `${rect.left - rootRect.left - rootEl.clientLeft}px`
  anchor.style.top = `${rect.bottom - rootRect.top - rootEl.clientTop}px`
}

function syncMention() {
  const editor = editorRef.value
  if (!editor) return
  if (pickerMode.value === 'reselect') return
  const caret = editor.getCaretOffset()
  const state = mention.update(currentDoc.value, caret)
  if (state) {
    pickerMode.value = 'mention'
    pickerFilter.value = state.filter
    positionMentionAnchor(state.anchorOffset)
    pickerTriggerDom.value = mentionAnchorRef.value ?? containerRef.value ?? undefined
  } else if (pickerMode.value === 'mention') {
    closePicker()
  }
}

function closePicker() {
  pickerMode.value = null
  reselectingSegIdx.value = null
  pickerFilter.value = ''
}

onMounted(() => {
  if (!containerRef.value) return
  const initialDoc = parse(props.modelValue ?? '', variableMap.value)
  currentDoc.value = initialDoc

  const editor = createEditor({
    container: containerRef.value,
    cls,
    initialDoc,
    getVariableMap: () => variableMap.value,
    onChange: (doc) => {
      currentDoc.value = doc
      const value = serializeFromDoc(doc)
      if (value !== (props.modelValue ?? '')) emit('update:modelValue', value)
      syncMention()
    },
    onVisualEmptyChange: (empty) => {
      visualEmpty.value = empty
    },
    onSelectionChange: () => {
      syncMention()
    },
    onChipReselect: ({ chipEl, segIndex }) => {
      if (disabled.value || readonly.value) return
      mention.commit()
      pickerMode.value = 'reselect'
      pickerFilter.value = ''
      pickerTriggerDom.value = chipEl
      reselectingSegIdx.value = segIndex
      // chip 的 mousedown 被 preventDefault，编辑器没有焦点时点击 chip 焦点不会转移，
      // 键盘导航依赖 container 的 keydown，这里主动把焦点拉回编辑器
      containerRef.value?.focus()
    }
  })
  editorRef.value = editor
})

onBeforeUnmount(() => {
  editorRef.value?.dispose()
})

function serializeFromDoc(doc: Doc): string {
  let s = ''
  for (const seg of doc) s += seg.kind === 'text' ? seg.value : `{${seg.value}}`
  return s
}

watch(
  () => props.modelValue,
  (v) => {
    const editor = editorRef.value
    if (!editor) return
    if (v === editor.getValue()) return
    editor.setValue(v ?? '')
  }
)

watch(variableMap, () => {
  // variables 变化：重渲染以刷新 chip label / type
  const editor = editorRef.value
  if (!editor) return
  editor.setValue(editor.getValue())
})

function onKeydown(e: KeyboardEvent) {
  if (disabled.value || readonly.value) return
  // mention / reselect 激活时，优先把箭头键 / Enter / Esc 转给 picker
  if (pickerMode.value !== null) {
    const handledByPicker = pickerRef.value?.handleKeydown(e)
    if (handledByPicker) {
      e.preventDefault()
      return
    }
  }

  if (pickerMode.value === 'mention') {
    // 这些键导致 mention 退出（保留 @filter 文本，光标继续移动）
    if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      mention.dismiss()
      closePicker()
    }
  }
}

function onBlur() {
  if (pickerMode.value === 'mention') {
    mention.dismiss()
    // 下一帧再关闭，避免和 picker 内 click 冲突
    void nextTick(() => closePicker())
  }
}

function onPickerSelect(item: VariableItem) {
  const editor = editorRef.value
  if (!editor) return

  if (pickerMode.value === 'mention') {
    const state = mention.getState()
    if (!state) return
    const anchor = state.anchorOffset
    const caret = editor.getCaretOffset() ?? anchor + state.filter.length + 1
    editor.replaceRangeWithVar(anchor, caret, {
      value: item.value,
      label: item.label,
      ...(item.type ? { type: item.type } : {})
    })
    mention.commit()
  } else if (pickerMode.value === 'reselect') {
    const idx = reselectingSegIdx.value
    if (idx !== null) {
      editor.replaceVarAt(idx, {
        value: item.value,
        label: item.label,
        ...(item.type ? { type: item.type } : {})
      })
    }
  }
  closePicker()
}

function onPickerDismiss() {
  if (pickerMode.value === 'mention') mention.dismiss()
  closePicker()
}

function onPickerVisibleChange(v: boolean) {
  if (!v && pickerMode.value !== null) {
    if (pickerMode.value === 'mention') mention.dismiss()
    closePicker()
  }
}
</script>
