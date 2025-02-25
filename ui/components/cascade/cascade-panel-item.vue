<template>
  <u-scroll tag="ul" :class="panelCls.b" :content-class="panelCls.e('content')">
    <li
      v-for="(item, index) of data"
      :key="getChainValue(item, cascadeProps.valueKey!) ?? index"
      :class="getItemCls(item)"
      @click="emit('click', panelIndex, item)"
    >
      <u-checkbox
        v-if="cascadeProps.multiple"
        :class="panelCls.e('option-checkbox')"
        :model-value="checkedSet.has(item)"
        @update:model-value="emit('check', item, $event)"
      />

      <span :class="panelCls.e('option-label')">
        {{ getChainValue(item, cascadeProps.labelKey!) }}
      </span>

      <u-icon
        :class="panelCls.e('option-expand')"
        v-if="item[cascadeProps.childrenKey!]?.length"
      >
        <ArrowRight />
      </u-icon>
    </li>
  </u-scroll>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { UScroll } from '../scroll'
import { CascadeDIKey } from './di'
import { getChainValue } from 'cat-kit'
import { UIcon } from '../icon'
import { ArrowRight } from 'icon-ultra'
import { bem } from '@ui/utils'
import { UCheckbox } from '../checkbox'

defineOptions({
  name: 'UCascadePanelItem'
})

const props = defineProps<{
  data: Record<string, any>[]
  value?: string
  panelIndex: number
}>()

const emit = defineEmits<{
  (e: 'click', panelIndex: number, item: Record<string, any>): void
  (e: 'check', item: Record<string, any>, checked: boolean): void
}>()

const { cls, cascadeProps, checkedSet } = inject(CascadeDIKey)!

const panelCls = cls.create('panel-item')

const optionCls = panelCls.e('option')

function getItemCls(item: Record<string, any>) {
  const { value } = props
  const selected = value === getChainValue(item, cascadeProps.valueKey!)
  return [
    optionCls,
    bem.is('active', selected),
    bem.is('selected', selected && !cascadeProps.multiple)
  ]
}
</script>
