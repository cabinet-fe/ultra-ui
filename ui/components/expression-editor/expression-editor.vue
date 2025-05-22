<template>
  <div :class="className">
    <!-- 工具栏 -->
    <!-- <div :class="cls.e('tools')">
      <u-icon :size="16" @click="showVariablePicker" ref="variable-picker-btn">
        <Variable />
      </u-icon>
    </div> -->

    <!-- 编辑容器 -->
    <div :class="cls.e('container')" ref="container" contenteditable></div>

    <!-- 渲染装饰器节点，内部通过Vue的Teleport组件渲染至节点中 -->
    <Decorators :decorators="decorators" />

    <!-- 上下文菜单 -->
    <Contextmenu
      v-model:visible="contextVisible"
      :trigger-dom="contextTriggerDom"
      @select="handleVariableSelect"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ExpressionEditorProps, VariableItem } from '@ui/types'
import { bem } from '@ui/utils'
import { useTemplateRef, provide, computed, type VNode } from 'vue'
import { ExpressionEditorDIKey } from './di'
import Contextmenu from './components/contextmenu.vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { useEditor } from './use-editor'
import { useDecorators } from './use-decorators'
import { useContext } from './use-context'
import { $createTextNode } from 'lexical'
import { $createVariableNode } from './nodes/variable-node'

defineOptions({
  name: 'ExpressionEditor'
})

const props = withDefaults(defineProps<ExpressionEditorProps>(), {
  placeholder: '请输入表达式，输入@可插入变量'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const cls = bem('expression-editor')

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props
])

const className = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('readonly', readonly.value)
  ]
})

const containerRef = useTemplateRef('container')

const editor = useEditor({
  disabled,
  readonly,
  cls,
  container: containerRef,
  props,
  emit
})

const { contextVisible, contextTriggerDom, textNode, charPosition } =
  useContext(editor)

const decorators = useDecorators(editor)

function Decorators(props: { decorators: VNode[] }) {
  return props.decorators
}

// 处理变量选择
function handleVariableSelect(variable: VariableItem) {
  if (disabled.value || readonly.value) return

  editor.update(() => {
    const textContent = textNode.value?.getTextContent()
    if (!textContent) return
    const newNode = $createVariableNode(variable.value)
    const nodeBefore = $createTextNode(
      textContent.slice(0, charPosition.value - 1)
    )
    const nodeAfter = $createTextNode(textContent.slice(charPosition.value))
    textNode.value?.replace(nodeBefore)
    nodeBefore.insertAfter(newNode)
    newNode.insertAfter(nodeAfter)
    newNode.selectEnd()
  })
}

provide(ExpressionEditorDIKey, {
  cls,
  editorProps: props
})
</script>
