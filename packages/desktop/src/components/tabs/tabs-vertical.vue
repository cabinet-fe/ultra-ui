<template>
  <div
    :class="[cls.b, cls.m('vertical'), cls.m(position), cls.m(size), bem.is('rounded', rounded)]"
  >
    <button
      type="button"
      role="tab"
      v-for="(item, index) in items"
      :key="item.key"
      :class="[
        cls.e('item'),
        bem.is('active', model === item.key),
        bem.is('disabled', item.disabled === true)
      ]"
      @click.stop="handleClick(item, index)"
    >
      <slot v-bind="{ item, index }">
        <span :class="cls.e('item-label')">{{ item.name ?? item.key }}</span>
      </slot>
      <span
        v-if="isItemClosable(item)"
        role="button"
        tabindex="0"
        :class="cls.e('close')"
        :aria-label="`close ${item.name ?? item.key}`"
        @click.stop="handleClose(item, index)"
      >
        <u-icon>
          <Close />
        </u-icon>
      </span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { useFallbackProps } from '@veltra/compositions'
import { Close } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'

import type { ComponentSize, TabItem, TabsVerticalEmits, TabsVerticalProps } from '../../types'
import { UIcon } from '../icon'

defineOptions({ name: 'TabsVertical' })

const props = withDefaults(defineProps<TabsVerticalProps>(), {
  position: 'left',
  closable: false,
  rounded: false
})

const emit = defineEmits<TabsVerticalEmits>()

const { size } = useFallbackProps([props], { size: 'default' as ComponentSize })

const cls = bem('tabs-bar')

const model = defineModel<string>()

const isItemClosable = (item: TabItem) => {
  if (item.disabled) return false
  return item.closable ?? props.closable
}

const handleClick = (item: TabItem, index: number) => {
  if (item.disabled) return
  model.value = item.key
  emit('click', item, index)
}

const handleClose = (item: TabItem, index: number) => {
  if (item.disabled) return
  emit('close', item, index)
}
</script>
