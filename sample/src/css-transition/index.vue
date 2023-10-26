<template>
  <div>
    <p>
      css-transition
      css过渡组件，专门用于实现css的过渡效果，和vue内置的transition组件类似。
    </p>
    <p>
      不同的是，该组件可以在非v-if, v-show， component切换状态下就能触发，
      通过一个active属性来控制，且仅有3种状态， enter-active, enter-to,
      leave-active
    </p>

    <p>
      同时为了提高性能，该组件还支持你调用它的toggle方法来触发过渡效果，使用这种方式带来的好处是transition里面的内容不再重新渲染了。
    </p>

    <p>最后，除了应用类之外， 该组件还支持使用你在不同的时机应用style属性而不仅仅局限于css类。</p>

    <u-button @click="transitionRef?.toggle(a => !a)"> 切换 </u-button>

    <u-css-transition name="transform" ref="transitionRef">
      <div class="box"></div>
    </u-css-transition>
  </div>
</template>

<script lang="ts" setup>
import type { CssTransitionExposed } from 'ultra-ui'
import { shallowRef } from 'vue'

// const active = shallowRef(false)

const transitionRef = shallowRef<CssTransitionExposed>()
</script>

<style lang="scss">
.box {
  width: 300px;
  height: 200px;
  background-color: #ccc;
}

.transform-enter-to {
  transform: translate(300px, 0);
}

.transform-enter-active,
.transform-leave-active {
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>
