<template>
  <u-tip
    ref="tipRef"
    :class="cls.b"
    :trigger="trigger"
    :direction="direction"
    :alignment="alignment"
    :content-tag="contentTag"
  >
    <slot name="reference" />

    <template #content>
      <div :class="[cls.m('main'), cls.m(size)]">
        <u-icon :size="16" :class="cls.m('icon')" :style="{ color: iconColor }">
          <component :is="icon" />
        </u-icon>
        <span>
          {{ title }}
        </span>
      </div>
      <div :class="cls.m('action')">
        <u-button size="small" @click="cancel" type="primary" text>
          {{ cancelText }}
        </u-button>
        &nbsp;
        <u-button size="small" type="primary" @click="confirm">
          {{ confirmText }}
        </u-button>
      </div>
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import type {
  PopConfirmProps,
  PopConfirmEmits
} from '@ui/types/components/pop-confirm'
import { bem } from '@ui/utils'
import { UTip, type TipExposed } from '../tip'
import { UButton } from '../button'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'
import { shallowRef } from 'vue'
import { UIcon } from '../icon'
import { HelpFilled } from 'icon-ultra'

defineOptions({
  name: 'PopConfirm'
})

const emit = defineEmits<PopConfirmEmits>()

withDefaults(defineProps<PopConfirmProps>(), {
  trigger: 'click',
  icon: HelpFilled,
  direction: 'bottom',
  iconColor: '#ffc107',
  confirmText: '确认',
  cancelText: '取消'
})

const cls = bem('pop-confirm')

const tipRef = shallowRef<TipExposed>()

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}], {
  size: 'default'
})

const confirm = () => {
  emit('confirm')
  tipRef.value?.close()
}

const cancel = () => {
  emit('cancel')
  tipRef.value?.close()
}
</script>
