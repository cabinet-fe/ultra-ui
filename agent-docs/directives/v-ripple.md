---
title: vRipple 波纹指令
description: 从 @veltra/directives 导入的水波纹动效指令与 Ripple 辅助类，鼠标左键按下时从按点扩散圆形波纹，松开或移出时淡出移除。用于按钮、分页页码、列表项、树节点等可点击元素的点击反馈，支持自定义波纹类名、指定动画时长、传 false 动态禁用。
aliases: [v-ripple, ripple, 水波纹, 波纹效果, 涟漪动效, Ripple 类]
keywords: [vRipple, v-ripple, Ripple, RippleConfig, showByEvent, u-ripple, "@veltra/directives", duration, rippleClass, 水波纹, 波纹效果, 涟漪, 点击反馈, 波纹动画时长, 自定义波纹, 禁用波纹]
---

# vRipple 波纹指令

`@veltra/directives` 导出 `vRipple`（模板写法 `v-ripple`）与 `Ripple` 辅助类。指令在元素上监听鼠标左键 `mousedown`，从按下坐标扩散一个覆盖整个容器的圆形波纹，`mouseup` 或 `mouseleave` 时淡出移除；绑定值为字符串时给波纹元素加自定义类名，`:时长` 参数指定动画毫秒数，`false` 动态禁用。使用前必须引入波纹样式。

## 快速上手

在 `<script setup>` 中导入指令与样式（缺样式时波纹元素无外观、不可见）：

```vue
<script setup lang="ts">
import { vRipple } from '@veltra/directives'
// 波纹样式必须引入；路径带 .js 后缀
import '@veltra/directives/ripple/style.js'
</script>

<template>
  <!-- 默认波纹 -->
  <button v-ripple>默认按钮</button>

  <!-- 绑定值为 false：禁用波纹 -->
  <button v-ripple="false">无波纹</button>
</template>

<style scoped>
button {
  padding: 8px 16px;
}
</style>
```

在应用入口全局注册后，全项目模板直接写 `v-ripple`：

```ts
// src/main.ts
import { createApp } from 'vue'
import { vRipple } from '@veltra/directives'
import '@veltra/directives/ripple/style.js'
import App from './App.vue'

const app = createApp(App)
app.directive('ripple', vRipple)
app.mount('#app')
```

使用 `@veltra/desktop` 的 `UltraUI` 插件时已内置同名注册（`app.directive('ripple', vRipple)`）；`UButton`、`UPaginator`、`USelect` 等组件的样式已包含波纹样式，组件内部使用时无需再单独引入。

## API 签名

```ts
import type { DirectiveBinding, ObjectDirective } from 'vue';

/** 波纹指令：绑定值 string 时作为波纹元素附加类名；精确等于 false 时禁用 */
export declare const vRipple: ObjectDirective<HTMLElement>;

/** 波纹效果类，适合不经指令、由业务事件驱动的场景 */
export declare class Ripple {
  /** 波纹样式类名生成器，Ripple.cls.b 为 'u-ripple' */
  static cls: { b: 'u-ripple' };
  constructor(container: HTMLElement, config?: RippleConfig);
  /** 返回波纹容器元素 */
  getContainer(): HTMLElement;
  /** 从指定容器坐标（px）显示波纹，同步 */
  show(centerPosition: { x: number; y: number }): void;
  /** 从鼠标或触摸事件提取按点坐标并显示波纹，同步；TouchEvent 取 touches[0] */
  showByEvent(e: MouseEvent | TouchEvent): void;
  /** 标记当前波纹淡出，opacity 过渡结束后从 DOM 移除，同步 */
  remove(): void;
  /** 清空容器尺寸缓存；容器尺寸变化后调用，否则波纹半径计算不准 */
  resetContainerRect(): void;
}

export interface RippleConfig {
  /** 波纹元素附加类名 */
  rippleClass?: string;
  /** 波纹过渡时长（毫秒）；不传用样式默认 300ms */
  duration?: number;
  /** 为 true 时波纹过渡结束自动移除，无需调用 remove() */
  autoRemove?: boolean;
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| 绑定值 | `string \| boolean \| undefined` | `undefined` | 否 | `string`：波纹元素附加该类名（本库组件传 BEM 元素类，如 `u-option__ripple`）；`false`：禁用（仅精确等于 `false` 生效，`0`、`''`、`null`、`undefined` 都不禁用）；省略：仅默认样式 |
| 指令参数 | `v-ripple:<毫秒数>` | `300` | 否 | `v-ripple:600` 表示过渡时长 600ms；值为 `0` 或空时按默认 300ms；时长同时作用于扩散与淡出过渡 |
| 修饰符 | 无 | — | — | 不支持任何修饰符 |
| 触发时机 | `mousedown` | — | — | 仅鼠标左键（`e.button === 0`）；右键、中键、纯触摸不触发 |
| 清理行为 | — | — | — | `mouseup` / `mouseleave` 时波纹淡出（加 `is-removing` 类，`opacity` 过渡结束或取消后从 DOM 移除）；`unmounted` 时注销事件并移除未结束的波纹 |

运行期间指令对容器样式的管理：容器 `position` 为 `static` 时临时改为 `relative`、`overflow` 为 `visible` 时临时改为 `hidden`（通过 dataset 引用计数，多实例协作），最后一个波纹移除后恢复为修改前的值。

## 方法与事件

指令本身无事件与暴露方法；`Ripple` 类方法均为同步、返回 `void`（`getContainer` 返回 `HTMLElement`），不抛错：

- `show(centerPosition)`：`centerPosition` 为相对容器的 `x`/`y` 坐标（px），超出容器边界的按点会得到更大的波纹半径。
- `showByEvent(e)`：接受 `MouseEvent`（用 `clientX`/`clientY`）或 `TouchEvent`（取 `touches[0]`）。
- `remove()`：内部标记当前波纹为可移除，等 `opacity` 的 `transitionend` 或 `transitioncancel` 后从 DOM 删除；配置了 `autoRemove: true` 时无需调用。
- `resetContainerRect()`：容器尺寸变化后调用；不调用时波纹半径按旧尺寸计算。

## 典型示例

### 按钮波纹：默认样式、自定义类名、指定时长与动态禁用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vRipple } from '@veltra/directives'
import '@veltra/directives/ripple/style.js'

const rippleOn = ref(true)

// 自定义波纹类名：叠加在默认 u-ripple 之上，可改颜色
const brandRipple = 'brand-ripple'
</script>

<template>
  <button v-ripple>默认波纹</button>

  <!-- :600 表示扩散与淡出过渡均为 600ms -->
  <button v-ripple:600>慢波纹</button>

  <button v-ripple="'brand-ripple'">品牌色波纹</button>

  <!-- 绑定值为 false 时禁用，运行期切换生效 -->
  <button v-ripple="rippleOn ? brandRipple : false">
    {{ rippleOn ? '带品牌波纹' : '已禁用' }}
  </button>

  <label><input type="checkbox" v-model="rippleOn" /> 启用波纹</label>
</template>

<style scoped>
button {
  position: relative;
  padding: 8px 16px;
  overflow: hidden;
}

.brand-ripple {
  background-color: rgba(59, 130, 246, 0.4);
}
</style>
```

### 列表项波纹：按行禁用

本库 `UPaginator`、`UTree` 等组件对每一项单独控制波纹，禁用行传 `false`：

```vue
<script setup lang="ts">
import { vRipple } from '@veltra/directives'
import '@veltra/directives/ripple/style.js'

interface Item {
  id: number
  label: string
  disabled: boolean
}

const items: Item[] = [
  { id: 1, label: '可用项', disabled: false },
  { id: 2, label: '禁用项', disabled: true },
  { id: 3, label: '可用项', disabled: false }
]
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id" v-ripple="!item.disabled">
      {{ item.label }}
    </li>
  </ul>
</template>

<style scoped>
li {
  padding: 8px 12px;
  cursor: pointer;
}
</style>
```

### 用 Ripple 类手动驱动波纹

需要自行管理实例生命周期（如在 `disabled` 变化时清理）时，直接使用 `Ripple` 类，`UMultiSelectOption` 内部即此用法：

```vue
<script setup lang="ts">
import { onBeforeUnmount, shallowRef } from 'vue'
import { Ripple } from '@veltra/directives'
import '@veltra/directives/ripple/style.js'

const rippleRef = shallowRef<Ripple | null>(null)

function handleMousedown(e: MouseEvent) {
  // 旧实例先清理，避免同一元素上多个 Ripple 实例同时改样式
  rippleRef.value?.remove()
  rippleRef.value = new Ripple(e.currentTarget as HTMLElement, {
    rippleClass: 'brand-ripple',
    duration: 400
  })
  rippleRef.value.showByEvent(e)
}

function handleMouseup() {
  rippleRef.value?.remove()
  rippleRef.value = null
}

onBeforeUnmount(() => {
  rippleRef.value?.remove()
  rippleRef.value = null
})
</script>

<template>
  <div class="card" @mousedown="handleMousedown" @mouseup="handleMouseup" @mouseleave="handleMouseup">
    卡片内容
  </div>
</template>

<style scoped>
.card {
  padding: 16px;
  border: 1px solid #ccc;
}

.brand-ripple {
  background-color: rgba(59, 130, 246, 0.4);
}
</style>
```

## 注意事项

> [!WARNING]
> - 本库指令从 `@veltra/directives` 导入（`import { vRipple } from '@veltra/directives'`），不是 Vue 内置指令；Vue 没有内置 `v-ripple`，Vuetify 的 `v-ripple` 也不是本指令。禁止写成 `import { vRipple } from 'vue'`。
> - 使用前必须 `import '@veltra/directives/ripple/style.js'`（带 `.js` 后缀），否则波纹元素没有样式、看不到效果。`@veltra/desktop` 的部分组件（`UButton`、`UPaginator`、`USelect` 等）样式已引入波纹样式；样式链未包含它的组件（如 `UTree`）单独使用时，需要应用自行引入。
> - 仅响应鼠标左键 `mousedown`（`e.button === 0`）；触摸事件在指令路径未注册。需要触摸波纹时用 `Ripple` 类的 `showByEvent`，它支持 `TouchEvent`。
> - 自定义类名与 `:时长` 参数在 `mounted` 时写入元素 `dataset`，`updated` 不再更新：挂载后修改字符串或参数不生效；挂载时值为 `false`、之后才切换为类名字符串的元素也带不上自定义类名。需要更换时用 `:key` 重建元素。
> - 禁用条件是绑定值精确等于 `false`；`v-ripple="0"`、`v-ripple="''"` 都不会禁用波纹。
> - 省略绑定值（裸写 `v-ripple`）时波纹元素会额外携带一个字面量为 `undefined` 的类名，无样式定义、无视觉影响。
> - 动画期间指令会临时改容器内联样式：`position: static` 改为 `relative`、`overflow: visible` 改为 `hidden`，波纹结束后精确恢复。禁止在动画进行中依赖这两个内联值。
> - 波纹元素类名：默认 `u-ripple`，淡出阶段追加 `is-removing`；自定义样式类写在这两者之外。

## 常见问题

### 绑定了 `v-ripple` 但点击看不到波纹

按顺序排查：

1. 未引入样式。修复：在用到指令的入口加 `import '@veltra/directives/ripple/style.js'`。
2. 绑定值为 `false`。检查表达式（如 `v-ripple="!disabled"` 中 `disabled` 的实际值）。
3. 点击的是鼠标右键或中键，指令只响应左键。

```vue
<script setup lang="ts">
import { vRipple } from '@veltra/directives'
import '@veltra/directives/ripple/style.js'
</script>

<template>
  <!-- 必须同时满足：样式已引入、值为非 false、左键点击 -->
  <button v-ripple>可点击</button>
</template>
```

### 自定义波纹类名在运行期切换后不生效

原因：类名只在 `mounted` 时写入元素 `dataset`，`updated` 钩子只处理 `false` 与非 `false` 之间的事件注册切换，不更新类名。修复：用 `:key` 让元素按类名重新挂载：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { vRipple } from '@veltra/directives'
import '@veltra/directives/ripple/style.js'

const theme = ref<'blue' | 'red'>('blue')

// computed 保证 theme 变化时绑定值同步更新
const rippleClass = computed(() => (theme.value === 'blue' ? 'ripple-blue' : 'ripple-red'))
</script>

<template>
  <!-- theme 变化时 key 变化，元素重新挂载，新类名生效 -->
  <button :key="theme" v-ripple="rippleClass">切换主题色波纹</button>

  <button @click="theme = theme === 'blue' ? 'red' : 'blue'">切换主题</button>
</template>

<style scoped>
.ripple-blue {
  background-color: rgba(59, 130, 246, 0.4);
}

.ripple-red {
  background-color: rgba(239, 68, 68, 0.4);
}
</style>
```
