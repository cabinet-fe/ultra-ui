<template>
  <div :class="className">
    <!-- 编辑容器 -->
    <div
      :class="cls.e('container')"
      ref="container"
      :contenteditable="!readonly && !disabled"
    ></div>

    <div :class="cls.e('placeholder')" v-if="showPlaceholder">
      {{ placeholder }}
    </div>

    <!-- 渲染装饰器节点，内部通过Vue的Teleport组件渲染至节点中 -->
    <Decorators :decorators="decorators" />

    <!-- 变量选择器 -->
    <VariablePicker
      v-model:visible="contextVisible"
      :trigger-dom="contextTriggerDom"
      :filterable="true"
      @select="handleVariableSelect"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ExpressionEditorProps, VariableItem } from '@ui/types'
import { bem } from '@ui/utils'
import { useTemplateRef, provide, computed, type VNode } from 'vue'
import { ExpressionEditorDIKey, createVariableMap } from './di'
import VariablePicker from './components/variable-picker.vue'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { useEditor } from './use-editor'
import { useDecorators } from './use-decorators'
import { useContext } from './use-context'
import { $createTextNode, $getNodeByKey, $getRoot } from 'lexical'
import { $createVariableNode, $isVariableNode } from './nodes/variable-node'

defineOptions({
  name: 'ExpressionEditor'
})

const props = withDefaults(defineProps<ExpressionEditorProps>(), {
  placeholder: '请输入表达式，输入 @ 可插入变量'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const showPlaceholder = computed(
  () => !props.modelValue || props.modelValue.trim() === ''
)

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

// 创建变量映射表
const variableMap = computed(() => createVariableMap(props.variables))

function Decorators(props: { decorators: VNode[] }) {
  return props.decorators
}

// 处理变量选择
function handleVariableSelect(variable: VariableItem) {
  if (disabled.value || readonly.value) return

  const nodeKey = textNode.value?.getKey()
  if (!nodeKey) return

  editor.update(() => {
    const targetNode = $getNodeByKey(nodeKey)
    if (!targetNode) return

    const textContent = targetNode.getTextContent()
    if (!textContent || !textContent.includes('@')) return

    const pos = charPosition.value
    const newNode = $createVariableNode(
      variable.value,
      variable.label,
      variable.type
    )
    const nodeBefore = $createTextNode(textContent.slice(0, pos - 1))
    const nodeAfter = $createTextNode(textContent.slice(pos))
    targetNode.replace(nodeBefore)
    nodeBefore.insertAfter(newNode)
    newNode.insertAfter(nodeAfter)
    newNode.selectEnd()
  })
}

// 更新变量节点的函数
function updateVariableNode(
  oldValue: string,
  newValue: string,
  newLabel?: string
) {
  editor.update(() => {
    const root = $getRoot()

    // 如果没有提供 label 或 type，从映射表中查找
    const variable = variableMap.value.get(newValue)
    const label = newLabel ?? variable?.label ?? newValue
    const type = variable?.type

    // 递归遍历所有节点
    function traverse(node: any) {
      if ($isVariableNode(node)) {
        if (node.getVariable() === oldValue) {
          node.updateVariable(newValue, label, type)
        }
      }

      // 如果节点有 getChildren 方法，继续遍历
      if (typeof node.getChildren === 'function') {
        const children = node.getChildren()
        children.forEach((child: any) => traverse(child))
      }
    }

    traverse(root)
  })
}

provide(ExpressionEditorDIKey, {
  cls,
  editorProps: props,
  editor,
  updateVariableNode,
  variableMap
})
</script>
