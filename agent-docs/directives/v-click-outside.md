---
title: vClickOutside 点击外部指令
description: 从 @veltra/directives 导入的点击外部检测指令，在 document 捕获阶段监听 mousedown 与 click，完整点击落在绑定元素外部时同步调用回调。用于下拉菜单、弹出层、右键菜单、抽屉点击外部自动关闭，支持动态换回调或传假值解除监听。
aliases: [v-click-outside, clickOutside, clickoutside, 点击外部关闭, 点击空白关闭, outside click]
keywords: [vClickOutside, v-click-outside, "@veltra/directives", MouseEvent, document, mousedown, capture, 点击外部关闭, 点击空白, 浮层关闭, 下拉关闭, 弹窗外部点击, 解除监听]
---

# vClickOutside 点击外部指令

`@veltra/directives` 导出 `vClickOutside`（模板写法 `v-click-outside`），在 `document` 上以捕获阶段监听 `mousedown` 与 `click`：当一次完整点击（按下与抬起命中同一元素）的目标不在绑定元素内部时，同步调用绑定值回调，回调收到该次点击的 `MouseEvent`。用于下拉、弹出层、右键菜单、抽屉的点击外部关闭。

## 快速上手

在 `<script setup>` 中导入 `vClickOutside`，绑定值为一个回调函数：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vClickOutside } from '@veltra/directives'

const open = ref(true)

// 点击面板外部时触发；event 是 document click 事件的 MouseEvent
function handleClickOutside(event: MouseEvent) {
  open.value = false
}
</script>

<template>
  <button @click="open = !open">切换</button>

  <div v-if="open" v-click-outside="handleClickOutside" class="panel">
    面板内容：点击这里不会触发回调
  </div>
</template>

<style scoped>
.panel {
  border: 1px solid #ccc;
  padding: 8px;
}
</style>
```

在应用入口全局注册后，全项目模板直接写 `v-click-outside`：

```ts
// src/main.ts
import { createApp } from 'vue'
import { vClickOutside } from '@veltra/directives'
import App from './App.vue'

const app = createApp(App)
app.directive('click-outside', vClickOutside)
app.mount('#app')
```

使用 `@veltra/desktop` 的 `UltraUI` 插件时已内置同名注册（`app.directive('click-outside', vClickOutside)`），`app.use(UltraUI)` 之后不必重复注册。

## API 签名

```ts
import type { ObjectDirective } from 'vue';

/**
 * 点击绑定元素外部时调用绑定值回调。
 * 绑定值类型：(event: MouseEvent) => void
 * 无修饰符、无指令参数。
 */
export declare const vClickOutside: ObjectDirective<HTMLElement>;
```

指令内部行为：

- 每个绑定元素在 `mounted` 时分配一个自增 id（从 `1000` 开始）写入 `el.dataset.outsideId`，并以 `{ handler, el }` 注册进共享字典；所有绑定元素共享一对 `document` 监听（`mousedown` + `click`，均为捕获阶段）。
- 回调触发必须同时满足：
  1. 本次 `mousedown` 的 `event.target` 与 `click` 的 `event.target` 是同一元素（在 A 上按下、拖到 B 上松开不触发）；
  2. `click` 的 `event.target` 不在该绑定元素内部，即 `el.contains(event.target)` 为 `false`。
- 每次点击对每个绑定元素最多回调一次。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| 绑定值 | `(event: MouseEvent) => void` | — | 要触发回调时必填 | `mounted` 时为假值（`undefined` / `false` / `null` / `0` / `''`）则不注册；`updated` 时换新函数立即生效，换成假值即解除监听 |
| 修饰符 | 无 | — | — | 不支持任何修饰符 |
| 指令参数 | 无 | — | — | 不支持 `v-click-outside:x` 写法 |
| 回调触发时机 | — | — | — | `document` 捕获阶段，先于目标元素自身的 `click` 冒泡处理 |
| 清理行为 | — | — | — | `unmounted` 时删除该元素注册；最后一个绑定元素卸载后移除 `document` 监听 |

## 方法与事件

指令没有事件与暴露方法，对外契约是绑定值回调：

- 签名：`(event: MouseEvent) => void`，同步调用，返回值被忽略。
- `event` 为触发判定的那次 `document` `click` 事件对象；`event.target` 是被点击的外部元素。
- 回调内部抛出的异常不会被指令捕获，会沿事件监听器正常上抛到控制台。

## 典型示例

### 点击外部关闭下拉面板

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vClickOutside } from '@veltra/directives'

const open = ref(false)

function close() {
  open.value = false
}
</script>

<template>
  <div class="dropdown">
    <button @click="open = !open">打开菜单</button>

    <!-- 指令必须绑在浮层内容根元素上，而不是触发按钮上 -->
    <ul v-if="open" v-click-outside="close" class="menu">
      <li @click="close">重命名</li>
      <li @click="close">删除</li>
    </ul>
  </div>
</template>

<style scoped>
.menu {
  border: 1px solid #ccc;
  list-style: none;
  margin: 4px 0 0;
  padding: 4px;
}
</style>
```

### 按触发方式动态启用与解除监听

绑定值在 `updated` 时重新求值：换成新函数立即替换回调，换成 `undefined` 即解除。与 `@veltra/desktop` 的 `UDropdown` 内部用法一致：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vClickOutside } from '@veltra/directives'

const trigger = ref<'click' | 'manual'>('click')
const open = ref(true)

function handleClickOutside() {
  open.value = false
}
</script>

<template>
  <select v-model="trigger">
    <option value="click">点击外部关闭</option>
    <option value="manual">手动关闭（解除监听）</option>
  </select>

  <!-- trigger 为 manual 时传入 undefined，监听被解除 -->
  <div v-click-outside="trigger === 'click' ? handleClickOutside : undefined">
    面板内容
  </div>
</template>
```

### 全局注册后配合 Teleport 浮层使用

浮层常被 `Teleport` 到 `body`，回调判定与挂载位置无关，只看 DOM 包含关系，所以指令要绑在浮层内容的根元素上：

```ts
// src/main.ts
import { createApp } from 'vue'
import { vClickOutside } from '@veltra/directives'
import App from './App.vue'

const app = createApp(App)
app.directive('click-outside', vClickOutside)
app.mount('#app')
```

```vue
<!-- src/components/Dialog.vue -->
<script setup lang="ts">
import { vClickOutside } from '@veltra/directives'

defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <div class="mask">
    <!-- 绑在弹窗盒子而非遮罩上：点击遮罩（盒子外部）触发 close -->
    <div class="dialog" v-click-outside="$emit('close')">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
}
.dialog {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 16px;
}
</style>
```

## 注意事项

> [!WARNING]
> - 本库指令从 `@veltra/directives` 导入（`import { vClickOutside } from '@veltra/directives'`），不是 Vue 内置指令；Vue 没有内置 `v-click-outside`，Element Plus 的 `v-clickoutside` 也不是本指令。禁止写成 `import { vClickOutside } from 'vue'`。
> - 判定单位是「完整点击」：按住拖动到别处松开（`mousedown` 与 `click` 的 `target` 不同）不触发回调；在元素上右键、只按下不抬起也不触发。
> - 点击绑定元素内部的任何子元素都不触发（按 `el.contains(target)` 判定）；要把可点击区域纳入，必须让它位于绑定元素内部。
> - 多个浮层同时打开且都绑定了本指令时，点击其中一个浮层会触发其余浮层的回调——判定只针对各自绑定元素。需要互斥时在回调里自行判断 `event.target` 是否在其他浮层内。
> - 回调在 `document` 捕获阶段执行，先于元素自身的 `click` 事件；在内部元素上 `event.stopPropagation()` 阻止的是冒泡，不影响本指令的判定。
> - 绑定值必须是函数才会触发；传假值等价于禁用。运行期切换函数直接生效，无需重新挂载元素。
> - `unmounted` 会删除回调注册，但元素上写入的 `data-outside-id` 属性不会被移除；排查 DOM 时不要把它当作业务属性。

## 常见问题

### 点击面板内部也触发了关闭回调

原因：指令绑定的元素不包含被点击的元素。最常见于浮层内容被 `Teleport` 到 `body`，而指令还绑在原位置的触发按钮上。修复：把指令移到浮层内容的根元素：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vClickOutside } from '@veltra/directives'

const open = ref(false)

function close() {
  open.value = false
}
</script>

<template>
  <button @click="open = true">打开</button>

  <Teleport to="body">
    <!-- 正确：绑在浮层根元素，内部点击不触发 -->
    <div v-if="open" v-click-outside="close" class="popover">浮层内容</div>
  </Teleport>
</template>
```

### 点击外部没有任何反应

按顺序排查两种原因：

1. 绑定值是假值：`v-click-outside="condition ? handler : undefined"` 中 `condition` 为假时监听未注册。检查表达式求值结果。
2. 按下与松开不在同一元素：在 A 上按下、拖到 B 上松开不满足判定。属于设计行为，不是 bug。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vClickOutside } from '@veltra/directives'

const enabled = ref(true)
const open = ref(true)

function close() {
  open.value = false
}
</script>

<template>
  <!-- enabled 为 true 时才注册监听 -->
  <div v-click-outside="enabled ? close : undefined">面板</div>
</template>
```
