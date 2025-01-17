<template>
  <u-tip ref="tip">
    <template #content>
      <ul :class="cls.e('variable-list')">
        <li
          v-for="item in editorProps.variables"
          :key="item.value"
          :class="cls.e('variable-item')"
          @click="insertVariable(item)"
        >
          {{ item.label }}
        </li>
      </ul>
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import { UTip } from '../../tip'
import { ExpressionEditorDIKey } from '../di'
import { inject, useTemplateRef } from 'vue'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  createEditor,
  TextNode,
  type LexicalCommand,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
  KEY_DOWN_COMMAND
} from 'lexical'
import { VariableNode } from '../nodes/variable-node'
import type { VariableItem } from '@ui/types'

const { cls, editor, editorProps } = inject(ExpressionEditorDIKey)!

const tipRef = useTemplateRef('tip')

// 插入变量
function insertVariable(variable: VariableItem) {
  editor.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const anchor = selection.anchor
      const node = anchor.getNode()
      const textContent = node.getTextContent()

      // 检查前一个字符是否为 '/'
      if (textContent[anchor.offset - 1] === '/') {
        // 将选区移动到 '/' 字符位置
        selection.anchor.offset = anchor.offset - 1
        selection.focus.offset = anchor.offset

        // 删除触发字符 '/'
        selection.deleteCharacter(false)
      }

      // 创建并插入变量节点
      const variableNode = new VariableNode(variable.label)
      selection.insertNodes([variableNode])
    }
  })
  // 关闭提示框
  tipRef.value?.close()
}

defineExpose({
  /** 打开插入变量选择器 */
  open(dom: HTMLElement) {
    tipRef.value?.trigger({
      triggerDom: dom
    })
  }
})
</script>
