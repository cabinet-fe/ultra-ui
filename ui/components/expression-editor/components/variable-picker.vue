<template>
  <u-tip ref="tip" hide-arrow trigger="click" style="width: 150px">
    <template #content>
      <ul :class="cls.e('variable-list')">
        <li
          v-for="(item, i) in editorProps.variables"
          :key="item.value"
          :class="[cls.e('variable-item'), bem.is('active', activeIndex === i)]"
          @click="handleSelect(item)"
          @mouseenter="activeIndex = i"
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
import { inject, ref, useTemplateRef } from 'vue'
import type { VariableItem } from '@ui/types'
import { bem } from '@ui/utils'

const emit = defineEmits<{
  (e: 'select', variable: VariableItem): void
}>()

const { cls, editorProps } = inject(ExpressionEditorDIKey)!

const tipRef = useTemplateRef('tip')
const activeIndex = ref(0)

function handleSelect(item: VariableItem) {
  emit('select', item)
  close()
}

function keydownHandler(e: KeyboardEvent) {
  if (!editorProps.variables?.length) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(
      editorProps.variables.length - 1,
      activeIndex.value + 1
    )
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(0, activeIndex.value - 1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const selectedItem = editorProps.variables[activeIndex.value]
    if (selectedItem) {
      handleSelect(selectedItem)
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

function open(dom: HTMLElement) {
  tipRef.value?.trigger({
    triggerDom: dom
  })
  activeIndex.value = 0
  document.addEventListener('keydown', keydownHandler)
}

function close() {
  tipRef.value?.close()
  document.removeEventListener('keydown', keydownHandler)
}

defineExpose({
  open,
  close
})
</script>

<style lang="scss">
.u-expression-editor {
  &__variable-list {
    list-style: none;
    margin: 0;
    padding: 4px 0;
  }

  &__variable-item {
    padding: 4px 8px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover,
    &.is-active {
      background-color: var(--u-primary-color-1);
      color: var(--u-primary-color);
    }
  }
}
</style>
