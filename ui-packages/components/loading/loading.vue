<template>
  <transition name="fade">
    <div v-show="visible" :class="[cls.b, cls.m(size)]" :style="{ zIndex: zIndex() }" ref="loadingRef">
      <div :class="cls.e('wrapper')">
        <UIcon :class="bem.is('loading')">
          <component :is="loadingIcon" />
        </UIcon>
        <p :class="cls.m('text')">{{ loadingText }}</p>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import type { LoadingProps } from "@ui/types/components/loading"
import { bem, setStyles, zIndex } from "@ui/utils"
import { shallowRef, Transition } from "vue"
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

let visible = shallowRef(true)

let loadingText = shallowRef(props.text)

const loadingRef = shallowRef<HTMLElement>()

const toggleVisible = (value: Record<string, any>) => {
  visible.value = value.show
  loadingText.value = value.text
  if (value.background && loadingRef.value) {
    setStyles(loadingRef.value, {
      background: value.background,
      opacity: 0.5,
      color: '#fff'
    })
    // if (value.icon) {
    // iconComponent.value = value.icon
    // }
  }
}

defineExpose({
  toggleVisible,
})
</script>
