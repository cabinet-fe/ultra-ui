<template>
  <div class="container">
    <u-scroll class="aside" tag="ul">
      <ListItem
        v-for="item in routes"
        :key="item.name"
        :route="item"
        :active="route.path === item.path"
      />
    </u-scroll>

    <u-scroll tag="main" style="flex-grow: 1; padding: var(--u-gap-default)">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </u-scroll>
  </div>
</template>

<script lang="tsx" setup>
import { useRoute, useRouter } from 'vue-router'
import { routes } from './router'
import { vRipple } from 'ultra-ui'
import { defineComponent } from 'vue'

const router = useRouter()
const route = useRoute()

const handleClick = (path: string) => {
  router.push(path)
}

const ListItem = defineComponent({
  directives: {
    ripple: vRipple
  },
  props: {
    active: Boolean,
    route: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    return () => {
      const { route, active } = props
      return (
        <li
          onClick={() => handleClick(route.path)}
          class={active ? 'active' : ''}
        >
          <div v-ripple='ripple-color'>{route.name}</div>
        </li>
      )
    }
  }
})
</script>

<style lang="scss" scoped>
@use '@ui/styles/functions' as fn;

.container {
  height: 100%;
  display: flex;
}

$width: 240px;
.aside {
  width: $width;
  border-right: fn.use-var(border);
  padding: 4px 0;
  flex-shrink: 0;
}

.aside {
  :deep(.active) {
    div {
      background-color: fn.use-var(color, primary, light-9);
    }
  }

  :deep(li) {
    height: 40px;
    padding: 2px 14px;
    cursor: pointer;
    user-select: none;

    div {
      border-radius: 4px;
      padding: 0 6px;
      line-height: 36px;
      height: 100%;

      &:hover {
        background-color: fn.use-var(color, primary, light-9);
      }
    }
  }

  :deep(.ripple-color) {
    background-color: rgba($color: #3f51b5, $alpha: 0.2);
  }
}

main {
  width: calc(100% - $width);
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
