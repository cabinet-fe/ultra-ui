<template>
  <u-scroll
    tag="ul"
    :class="panelCls.b"
    ref="scroll-container"
    :content-class="panelCls.e('content')"
  >
    <li
      v-for="(node, index) of data"
      :key="node.value ?? index"
      ref="itemRefs"
      :class="getItemCls(node)"
      @click="emit('click', panelIndex, node)"
    >
      <u-checkbox
        v-if="cascadeProps.multiple"
        :class="panelCls.e('option-checkbox')"
        :model-value="checkedSet.has(node)"
        @update:model-value="emit('check', node, $event)"
      />

      <span :class="panelCls.e('option-label')">
        {{ node.label }}
      </span>

      <u-icon :class="panelCls.e('option-expand')" v-if="node.children?.length">
        <ArrowRight />
      </u-icon>
    </li>
  </u-scroll>
</template>

<script lang="ts" setup>
import { inject, onMounted, shallowRef, useTemplateRef } from 'vue'
import { UScroll } from '../scroll'
import { CascadeDIKey } from './di'
import { UIcon } from '../icon'
import { ArrowRight } from 'lucide-vue-next'
import { bem, scrollIntoContainerView } from '@ultra-ui/core'
import { UCheckbox } from '../checkbox'
import type { CascadeNode } from '@ultra-ui/pc/types'

defineOptions({
  name: 'UCascadePanelItem'
})

const props = defineProps<{
  data: CascadeNode[]
  value?: string
  panelIndex: number
}>()

const emit = defineEmits<{
  (e: 'click', panelIndex: number, item: CascadeNode): void
  (e: 'check', item: CascadeNode, checked: boolean): void
}>()

const { cls, cascadeProps, checkedSet } = inject(CascadeDIKey)!

const panelCls = cls.create('panel-item')

const optionCls = panelCls.e('option')

function getItemCls(item: CascadeNode) {
  const selected = props.value === item.value
  return [
    optionCls,
    bem.is('active', selected),
    bem.is('selected', selected && !cascadeProps.multiple)
  ]
}

const itemRefs = shallowRef<HTMLElement[]>([])
const scrollContainerRef = useTemplateRef('scroll-container')

onMounted(() => {
  const activeItem = itemRefs.value.find(el =>
    el.classList.contains(bem.is('active'))
  )
  if (activeItem) {
    setTimeout(() => {
      scrollIntoContainerView(
        activeItem,
        scrollContainerRef.value?.containerRef ?? null
      )
    })
  }
})
</script>
