<template>
  <ul :class="[cls.b, cls.m(size)]" v-if="!readonly">
    <li v-if="isEmpty && creatable">
      <u-button style="width: 100%" :icon="Plus" @click="handleAdd(0)" :size="size">
        新增
      </u-button>
    </li>
    <li v-for="(item, index) of items" :key="item.id" :class="cls.e('item')" :style="itemStyle">
      <slot v-bind="{ item: item.data, index }" />
      <span :class="cls.e('actions')">
        <u-button
          :icon="Minus"
          circle
          :disabled="disabled"
          :size="size"
          @click="handleRemove(index)"
        />
        <u-button :icon="Plus" circle :disabled="disabled" :size="size" @click="handleAdd(index)" />
      </span>
    </li>
  </ul>

  <template v-else-if="items?.length">
    <ul :class="[cls.b, cls.m(size)]">
      <li v-for="item of items" :key="item.id" :class="cls.e('item')">
        <span v-for="v in item.data">{{ v }}</span>
      </li>
    </ul>
  </template>

  <template v-else>
    {{ FORM_EMPTY_CONTENT }}
  </template>
</template>

<script lang="ts" setup generic="GroupItem extends Record<string, any>">
import { useFormComponent, useFormFallbackProps } from '@veltra/compositions'
import { Minus, Plus } from '@veltra/icons/normal'
import { bem, FORM_EMPTY_CONTENT } from '@veltra/utils'
import { computed } from 'vue'

import type { GroupInputEmits, GroupInputProps } from '../../types'
import { UButton } from '../button'
import { useGroupItems } from './use-group-items'

defineOptions({
  name: 'GroupInput'
})

const props = withDefaults(defineProps<GroupInputProps<GroupItem>>(), {
  modelValue: () => [],
  disabled: undefined,
  readonly: undefined,
  creatable: true
})

const emit = defineEmits<GroupInputEmits>()

const cls = bem('group-input')

const { formProps } = useFormComponent()
const { disabled, size, readonly } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default',
  disabled: false,
  readonly: false
})

const { items, createItem, runByEvent } = useGroupItems({
  props,
  emit
})

const isEmpty = computed(() => {
  return !items.value.length
})

function handleAdd(index: number) {
  runByEvent(() => {
    items.value = [
      ...items.value.slice(0, index + 1),
      createItem({}),
      ...items.value.slice(index + 1)
    ]
  })
}

function handleRemove(index: number) {
  runByEvent(() => {
    items.value = [...items.value.slice(0, index), ...items.value.slice(index + 1)]
  })
}
</script>
