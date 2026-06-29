<template>
  <span :class="className">
    <span :class="cls.e('content')">
      <slot />
    </span>

    <u-icon v-if="closable" @click.stop="handleClose" :class="cls.e('icon-close')">
      <Close />
    </u-icon>
  </span>
</template>

<script lang="ts" setup>
import { useFormFallbackProps } from '@veltra/compositions'
import { Close } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed } from 'vue'

import type { TagEmits, TagProps } from '../../types'
import { UIcon } from '../icon'

defineOptions({ name: 'UTag' })

const cls = bem('tag')

const props = defineProps<TagProps>()

const emit = defineEmits<TagEmits>()

const { formProps } = injectFormContext()
const { size } = useFormFallbackProps([formProps ?? {}, props], { size: 'default' })

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

// const classRound = computed(() => {
//   return [bem.is('round', props.round)]
// })
</script>
