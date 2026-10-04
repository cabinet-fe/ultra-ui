<template>
  <span :class="className">
    <span :class="cls.e('content')">
      <slot />
    </span>

    <UIcon v-if="closable" :class="cls.e('icon-close')" @click.stop="handleClose">
      <Close />
    </UIcon>
  </span>
</template>

<script lang="ts" setup>
import { Close } from '@veltra/icons/normal'
import { injectFormContext } from '@veltra/utils'
import { computed } from 'vue'

import { bem } from '../../shared/bem'
import type { TagEmits, TagProps } from '../../types/tag'
import { UIcon } from '../icon'

defineOptions({ name: 'UTag' })

const cls = bem('tag')

const props = defineProps<TagProps>()

const emit = defineEmits<TagEmits>()

// 表单内继承表单尺寸，与 desktop tag 行为一致
const { formProps } = injectFormContext()

const size = computed(() => props.size ?? formProps?.size ?? 'default')

const handleClose = () => {
  emit('close')
}

const className = computed(() => {
  const { type } = props
  return [
    cls.b,
    cls.m(size.value),
    type && cls.m('color-' + type),
    bem.is('round', props.round),
    bem.is('dark', props.dark)
  ]
})
</script>
