<template>
  <u-tip position="top" :trigger="trigger">
    <div>
      <slot name="reference" />
    </div>

    <template #content>
      <div :class="cls.b">
        {{ title }}
        <div class="u-popconfirm__content">
          <u-button>确定</u-button>
          <u-button>取消</u-button>
        </div>
      </div>
    </template>
  </u-tip>
</template>

<script lang="ts" setup>
import type { PopconfirmProps } from "@ui/types/components/popconfirm"
import { bem } from "@ui/utils"
import { UTip } from "../tip"

defineOptions({
  name: "Popconfirm",
})

withDefaults(defineProps<PopconfirmProps>(), {
  trigger: "hover",
})

const cls = bem("popconfirm")
</script>
