<template>
  <u-scroll tag="ul" :class="cls.e('panel')">
    <li
      v-for="(item, index) of data"
      :key="getChainValue(item, cascadeProps.valueKey!) ?? index"
      :class="[
        cls.e('panel-item'),
        bem.is(
          'selected',
          value === getChainValue(item, cascadeProps.valueKey!)
        )
      ]"
      @click="emit('expand', item)"
    >
      {{ getChainValue(item, cascadeProps.labelKey!) }}

      <u-icon v-if="item[cascadeProps.childrenKey!].length">
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

defineOptions({
  name: 'UCascadePanel'
})

defineProps<{
  data: Record<string, any>[]
  value?: string
}>()

const emit = defineEmits<{
  (e: 'expand', item: Record<string, any>): void
}>()

const { cls, cascadeProps } = inject(CascadeDIKey)!
</script>
