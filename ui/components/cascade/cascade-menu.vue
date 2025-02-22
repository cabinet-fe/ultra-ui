<template>
  <u-scroll tag="ul" :class="panelCls.b">
    <li
      v-for="(item, index) of data"
      :key="getChainValue(item, cascadeProps.valueKey!) ?? index"
      :class="[
        panelCls.e('item'),
        bem.is(
          'selected',
          value === getChainValue(item, cascadeProps.valueKey!)
        )
      ]"
      @click="emit('click', item)"
    >
      <u-checkbox
        :class="panelCls.e('item-checkbox')"
        v-if="cascadeProps.multiple"
      />

      <span :class="panelCls.e('item-label')">
        {{ getChainValue(item, cascadeProps.labelKey!) }}
      </span>

      <u-icon
        :class="panelCls.e('item-expand')"
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
  name: 'UCascadeMenu'
})

defineProps<{
  data: Record<string, any>[]
  value?: string
}>()

const emit = defineEmits<{
  (e: 'click', item: Record<string, any>): void
}>()

const { cls, cascadeProps } = inject(CascadeDIKey)!

const panelCls = cls.create('menu')
</script>
