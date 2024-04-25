<template>
  <transition name="fade">
    <div :class="[cls.b, cls.m(size)]" :style="{ zIndex: zIndex() }" ref="loadingRef">
      <div :class="cls.e('wrapper')">
        <UIcon :class="bem.is('loading')">
          <component :is="loadingIcon" />
        </UIcon>
        <p :class="cls.m('text')">{{ text }}</p>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import type { LoadingProps } from "@ui/types/components/loading"
import { bem, setStyles, zIndex } from "@ui/utils"
import { onMounted, shallowRef, Transition } from "vue"
import { UIcon } from "../icon"
import { Loading } from "icon-ultra"
import { useFallbackProps } from "@ui/compositions"
import type { ComponentSize } from "@ui/types/component-common"

defineOptions({
  name: "Loading",
})

const props = withDefaults(defineProps<LoadingProps>(), {
  text: "Loading...",
  loadingIcon: () => Loading,
})

const { size } = useFallbackProps([props], {
  size: "default" as ComponentSize,
})

const cls = bem("loading")

const loadingRef = shallowRef<HTMLElement>()

onMounted(() => {
  if (props.background && loadingRef.value) {
    setStyles(loadingRef.value, {
      background: props.background,
      opacity: 0.5,
      color: '#fff'
    })
  }
})
</script>
