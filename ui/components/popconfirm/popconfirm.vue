<template>
  <u-tip
    position="bottom"
    :trigger="trigger"
    :class="cls.b"
    :mouse-leave-close="true"
    ref="tipRef"
  >
    <div>
      <slot name="reference" />
    </div>

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
        <u-button type="primary" @click="confirm">{{ confirmText }}</u-button>
        <i></i>
        <u-button @click="cancel">{{ cancelText }}</u-button>
      </div>
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import type {
  PopconfirmProps,
  PopconfirmEmits,
} from "@ui/types/components/popconfirm"
import { bem } from "@ui/utils"
import { UTip, type TipExposed } from "../tip"
import { UButton } from "../button"
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"
import { shallowRef } from "vue"
import { UIcon } from "../icon"
import { HelpFilled } from "icon-ultra"
defineOptions({
  name: "Popconfirm",
})

const emit = defineEmits<PopconfirmEmits>()

withDefaults(defineProps<PopconfirmProps>(), {
  trigger: "click",
  size: "default",
  icon: HelpFilled,
  iconColor: "#ffc107",
  confirmText: "确认",
  cancelText: "取消",
})

const cls = bem("popconfirm")

const tipRef = shallowRef<TipExposed>()

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}], {
  size: "default",
})

const confirm = () => {
  emit("confirm")
  tipRef.value?.handleClickOutside()
}

const cancel = () => {
  emit("cancel")
  tipRef.value?.handleClickOutside()
}
</script>
