<template>
  <ul :class="[cls.b, cls.m(size)]" v-if="!readonly">
    <li v-if="isEmpty && creatable">
      <u-button
        style="width: 100%"
        :icon="Plus"
        @click="handleAdd(0)"
        :size="size"
      >
        新增
      </u-button>
    </li>
    <li v-for="(item, index) of items" :key="item.id" :class="cls.e('item')">
      <slot v-bind="{ item: item.data, index }" />
      <span :class="cls.e('actions')">
        <u-button
          :icon="Minus"
          circle
          :disabled="disabled"
          :size="size"
          @click="handleRemove(index)"
        />
        <u-button
          :icon="Plus"
          circle
          :disabled="disabled"
          :size="size"
          @click="handleAdd(index)"
        />
      </span>
    </li>
  </ul>

  <template v-else>
    <ul :class="[cls.b, cls.m(size)]">
      <li v-for="item of items" :key="item.id" :class="cls.e('item')">
        <span v-for="v in item.data">{{ v }}</span>
      </li>
    </ul>
  </template>
</template>

<script lang="ts" setup generic="GroupItem extends Record<string, any>">
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import type {
  GroupInputEmits,
  GroupInputProps
} from '@ui/types/components/group-input'
import { bem } from '@ui/utils'
import { Minus, Plus } from 'icon-ultra'
import { useGroupItems } from './use-group-items'
import { computed } from 'vue'
import { UButton } from '../button'

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
const { disabled, size, readonly } = useFormFallbackProps(
  [formProps ?? {}, props],
  {
    size: 'default',
    disabled: false,
    readonly: false
  }
)

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
    items.value = [
      ...items.value.slice(0, index),
      ...items.value.slice(index + 1)
    ]
  })
}
</script>
