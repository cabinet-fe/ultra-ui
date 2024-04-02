<template>
  <div :class="classList">
    <div :class="cls.e('content')">
      <slot />

      <UIcon v-if="closable" @click="handleClose"> <CircleClose /> </UIcon>
      <!-- <u-button circle size="small" text :type="type" v-if="closable" @click.prevent="handleClose">
        x
      </u-button> -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TagEmits, TagProps } from '@ui/types/components/tag'
import { bem } from '@ui/utils'
import { UButton } from '../button'
import { computed } from 'vue'
import { UIcon } from '..'
import { CircleClose } from 'icon-ultra'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'

defineOptions({
  name: 'Tag'
})

const cls = bem('tag')

const props = withDefaults(defineProps<TagProps>(), {})

const emits = defineEmits<TagEmits>()

const { formProps } = useFormComponent()
const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default'
})

const handleClose = () => {
  emits('close')
}

const classList = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    props.type ? cls.e(props.type) : '',
    props.size ? cls.m(props.size) : '',
    props.round ? bem.is('round') : ''
  ]
})

// const classRound = computed(() => {
//   return [bem.is('round', props.round)]
// })
</script>
