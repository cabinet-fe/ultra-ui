<template>
  <div class="container">
    <aside>
      <ul>
        <li
          v-for="{ name, path } of routes"
          :key="name"
          @click="handleClick(path)"
          :class="{
            active: path === route.path
          }"
        >
          <div v-ripple>
            {{ c.log(11) }}
            {{ name }}
          </div>
        </li>
      </ul>
    </aside>
    <main style="padding: var(--u-gap-default)">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { routes } from './router'
import { vRipple } from 'ultra-ui'

const router = useRouter()
const route = useRoute()

const handleClick = (path: string) => {
  router.push(path)
}
</script>

<style lang="scss" scoped>
@use '@ui/styles/functions' as fn;

.container {
  height: 100%;
  display: flex;
}

$width: 240px;
aside {
  width: $width;
  border-right: fn.use-var(border);
  overflow: auto;
}

li {
  height: 40px;
  padding: 2px 6px;
  cursor: pointer;
  user-select: none;

  div {
    border-radius: 4px;
    padding: 0 6px;
    line-height: 36px;
    height: 100%;

    &:hover {
      background-color: #f2f2f2;
    }
  }
}

main {
  width: calc(100% - $width);
}

.active {
  div {
    background-color: #f2f2f2;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
