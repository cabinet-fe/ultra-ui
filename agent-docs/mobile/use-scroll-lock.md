---
title: useScrollLock 滚动锁定
description: '@veltra/mobile 导出的 body 滚动锁定组合式函数：lock()/unlock() 成对调用，弹层打开期间锁死页面滚动、关闭后回到原滚动位置；计数嵌套，多个弹层叠加时只有最外层解锁才恢复。UDialog / UDrawer / BottomSheet 内部即用它锁定背景滚动。'
aliases: [ScrollLock, 锁定背景滚动, body scroll lock, 滚动锁, 页面滚动锁定]
keywords:
  [
    useScrollLock,
    ScrollLock,
    lock,
    unlock,
    滚动锁定,
    锁定背景滚动,
    body滚动,
    弹层滚动,
    滚动位置恢复,
    嵌套计数,
    position fixed,
    iOS橡皮筋
  ]
---

# useScrollLock 滚动锁定

`@veltra/mobile` 导出的组合式函数 `useScrollLock`：锁定期间锁死 body 页面滚动，解锁时还原 body 原有内联样式并 `window.scrollTo` 回锁定前的滚动位置。模块级计数支持嵌套，多个弹层叠加时各自 `lock()` / `unlock()`，计数归零（最外层解锁）才真正恢复。

## 快速上手

```vue
<script setup lang="ts">
import { useScrollLock } from '@veltra/mobile'
import { watch } from 'vue'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const { lock, unlock } = useScrollLock()

// 弹层显隐驱动锁定 / 解锁
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      lock()
    } else {
      unlock()
    }
  }
)

const close = () => emit('update:visible', false)
</script>

<template>
  <div v-if="props.visible" class="my-popup" @click="close">内容</div>
</template>
```

## API 签名

```ts
import { useScrollLock } from '@veltra/mobile'

/** lock()/unlock() 的返回句柄 */
export interface ScrollLock {
  /** 锁定 body 滚动；可嵌套调用，每次调用计数 +1 */
  lock: () => void
  /** 解锁一层；本句柄未持锁时为空操作 */
  unlock: () => void
}

export function useScrollLock(): ScrollLock
```

## 参数说明

`useScrollLock()` 无参数、无响应式状态，任意组件 `setup` 中调用即可。

## 方法与事件

| 方法       | 签名        | 返回   | 行为                                                                                                                                                     |
| ---------- | ----------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lock`     | `() => void` | 无返回 | 计数 +1。计数从 0 变 1 时记录 `window.scrollY` 与 body 现有内联样式（`position` / `top` / `left` / `width` / `overflow`），然后给 body 设 `position: fixed; top: -scrollYpx; left: 0; width: 100%; overflow: hidden` 定住页面。计数已 ≥1 时仅计数，不重复改写样式 |
| `unlock`   | `() => void` | 无返回 | 计数 -1。计数归 0 时把上述五个内联样式逐项还原为锁定前的值（锁定前未设置的内联样式会被移除），并 `window.scrollTo(0, scrollY)` 回原滚动位置。计数仍 ≥1 时只计数不恢复。本句柄未持锁（未 `lock` 过或已 `unlock` 过）时为空操作，不会误减其他弹层的计数 |

两个方法均为同步执行，不抛错。

句柄随组件销毁自动兜底：持锁期间组件被整体卸载（如外层 `v-if` 直接移除弹层）时，作用域销毁会自动补一次 `unlock`，页面不会卡在锁定态。

## 典型示例

### 自定义弹层锁定背景滚动

```vue
<script setup lang="ts">
import { useScrollLock } from '@veltra/mobile'
import { ref } from 'vue'

const open = ref(false)
const { lock, unlock } = useScrollLock()

function openPopup() {
  open.value = true
  lock()
}

function closePopup() {
  open.value = false
  unlock() // 页面回到打开前的滚动位置
}
</script>

<template>
  <button type="button" @click="openPopup">打开</button>
  <div v-if="open" class="my-popup" @click="closePopup">点击关闭</div>
</template>
```

### 多个弹层叠加（嵌套计数）

```vue
<script setup lang="ts">
import { useScrollLock } from '@veltra/mobile'
import { ref } from 'vue'

const showDrawer = ref(false)
const showDialog = ref(false)

// 两个组件各自持有一份句柄，计数在模块内共享
const drawerLock = useScrollLock()
const dialogLock = useScrollLock()

function openDrawer() {
  showDrawer.value = true
  drawerLock.lock() // 计数 1：body 被定住
}

function openDialog() {
  showDialog.value = true
  dialogLock.lock() // 计数 2：样式不变，仍锁定
}

function closeDialog() {
  showDialog.value = false
  dialogLock.unlock() // 计数 1：抽屉还在，页面仍锁定
}

function closeDrawer() {
  showDrawer.value = false
  drawerLock.unlock() // 计数 0：还原样式并回到原滚动位置
}
</script>

<template>
  <button type="button" @click="openDrawer">打开抽屉</button>
  <div v-if="showDrawer" class="my-drawer" @click="closeDrawer">
    抽屉
    <button type="button" @click.stop="openDialog">再开对话框</button>
  </div>
  <div v-if="showDialog" class="my-dialog" @click="closeDialog">对话框</div>
</template>
```

## 注意事项

> [!WARNING]
>
> - 锁定实现是 body `position: fixed`，不是只设 `overflow: hidden`：iOS Safari 下 `overflow: hidden` 阻不住橡皮筋滚动。锁定期间桌面端滚动条会消失，属预期行为。
> - 只锁 body / window 页面滚动；弹层内部容器（自身 `overflow: auto`）照常滚动。
> - `lock()` / `unlock()` 必须成对调用且来自同一句柄；只 `unlock` 不 `lock` 是空操作，不会影响其他持有者。
> - `useScrollLock` 与 `@veltra/compositions`、`@veltra/utils` 中的滚动工具无关联，本函数只处理 body 锁定与滚动位置恢复。
