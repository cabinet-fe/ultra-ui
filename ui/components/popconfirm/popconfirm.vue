<template>
  <u-tip
    :position="direction"
    :trigger="trigger"
    :class="cls.b"
    :mouse-leave-close="true"
    ref="tipRef"
  >
    <div @mouseenter="handleMouseEnter">
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
        <u-button size="small" @click="cancel" type="primary" text>{{ cancelText }}</u-button>
        <i></i>
        <u-button size="small" type="primary" @click="confirm">{{ confirmText }}</u-button>
      </div>
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import type {
  PopconfirmProps,
  PopconfirmEmits,
} from "@ui/types/components/popconfirm"

import type { positionType } from "@ui/types/components/tip"

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

const direction = shallowRef<positionType>("bottom")

const cls = bem("popconfirm")

const tipRef = shallowRef<TipExposed>()

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}], {
  size: "default",
})

const confirm = () => {
  emit("confirm")
  tipRef.value?.closeTipContent()
}

const cancel = () => {
  emit("cancel")
  tipRef.value?.closeTipContent()
}

const handleMouseEnter = (event: MouseEvent) => {
  const { x, y } = event

  const position: {
    top?: number
    left?: number
    right?: number
    bottom?: number
    transformOrigin?: string
  } = {}

  if (x > window.innerWidth / 2) {
    position.right = window.innerWidth - x - 1
  } else {
    position.left = x + 1
  }

  if (y > window.innerHeight / 2) {
    position.bottom = window.innerHeight - y - 1
  } else {
    position.top = y + 1
  }

  const positionX = position.top ? "bottom" : "top"
  const positionY = position.left ? "start" : "end"
  position.transformOrigin = `${positionX}-${positionY}`
  direction.value = position.transformOrigin as positionType
}
</script>
