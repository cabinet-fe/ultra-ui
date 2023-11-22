<template>
  <div class="container">
    <aside>
      <ul>
        <ListItem
          v-for="item in routes"
          :key="item.name"
          :route="item"
          :active="route.path === item.path"
        />
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
          <div v-ripple>{route.name}</div>
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
aside {
  width: $width;
  border-right: fn.use-var(border);
  overflow: auto;
}

aside :deep {
  .active {
    div {
      background-color: #f2f2f2;
    }
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
