---
title: vFocus 自动聚焦指令
description: 从 @veltra/directives 导入的自动聚焦指令，元素挂载时把焦点放到 <input> 上：元素本身是 input 则直接聚焦，否则聚焦第一个 input 后代。用于搜索框挂载即聚焦、弹窗/抽屉打开后首个输入控件自动获焦、条件渲染表单进入编辑态。
aliases: [v-focus, autofocus, 自动聚焦, 输入框聚焦, focus 指令]
keywords: [vFocus, v-focus, "@veltra/directives", input, querySelector, mounted, 自动聚焦, 获取焦点, 输入框聚焦, 搜索框聚焦, 弹窗聚焦, autofocus, 指令需要一个 input 元素]
---

# vFocus 自动聚焦指令

`@veltra/directives` 导出 `vFocus`（模板写法 `v-focus`），在绑定元素 `mounted` 时自动聚焦：元素本身是 `<input>` 则调用 `el.focus()`，否则查找第一个 `<input>` 后代并聚焦。无绑定值、无修饰符、无指令参数，只处理 `<input>` 标签。

## 快速上手

在 `<script setup>` 中导入 `vFocus` 后即可在模板使用 `v-focus`（Vue 会把 `v-focus` 解析为局部指令 `vFocus`）：

```vue
<script setup lang="ts">
import { vFocus } from '@veltra/directives'
</script>

<template>
  <!-- 元素本身是 input：直接聚焦 -->
  <input v-focus placeholder="搜索" />

  <!-- 元素不是 input：聚焦第一个 input 后代 -->
  <div v-focus class="search-bar">
    <span>关键词：</span>
    <input placeholder="挂载时自动聚焦" />
  </div>
</template>
```

在应用入口用 `app.directive()` 全局注册后，全项目模板直接写 `v-focus`，无需逐个导入：

```ts
// src/main.ts
import { createApp } from 'vue'
import { vFocus } from '@veltra/directives'
import App from './App.vue'

const app = createApp(App)
app.directive('focus', vFocus) // 全局注册，模板写 v-focus
app.mount('#app')
```

使用 `@veltra/desktop` 的 `UltraUI` 插件时已内置同名注册（`app.directive('focus', vFocus)`），`app.use(UltraUI)` 之后不必重复注册。

## API 签名

```ts
import type { ObjectDirective } from 'vue';

/**
 * 挂载时自动聚焦元素或其第一个 input 后代。
 * 无绑定值（传入值被忽略）、无修饰符、无指令参数。
 */
export declare const vFocus: ObjectDirective<HTMLElement>;
```

指令内部只在 `mounted` 钩子执行，按以下顺序判定：

1. `el.tagName === 'INPUT'`：调用 `el.focus()`。
2. 否则执行 `el.querySelector('input')`：找到则聚焦第一个匹配的 `<input>` 后代。
3. 找不到：不聚焦，输出警告 `console.warn('v-focus 指令需要一个 input 元素')`。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| 绑定值 | 无 | — | 否 | `v-focus="expr"` 语法合法但表达式值被完全忽略，禁止依赖它传配置 |
| 修饰符 | 无 | — | — | 不支持任何修饰符 |
| 指令参数 | 无 | — | — | 不支持 `v-focus:x` 写法 |
| 触发时机 | `mounted` | — | — | 仅元素挂载时执行一次；组件更新（`updated`）不重新聚焦 |
| 清理行为 | 无 | — | — | 无事件监听、无定时器，卸载时无需清理；聚焦本身是同步一次性调用 |

## 典型示例

### 搜索页挂载即聚焦输入框

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vFocus } from '@veltra/directives'

const keyword = ref('')

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && keyword.value) {
    // 执行搜索：<占位符> 替换为你的搜索函数
    console.log(keyword.value) // => 输入框回车时的关键词
  }
}
</script>

<template>
  <input v-focus v-model="keyword" placeholder="输入后按回车搜索" @keydown="handleKeydown" />
</template>
```

### 条件渲染的编辑行，重新挂载时重新聚焦

指令只在 `mounted` 执行。要让同一位置再次聚焦，必须让元素重新挂载（`v-if` 切换或改 `:key`）：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vFocus } from '@veltra/directives'
import { UInput } from '@veltra/desktop'

const editing = ref(false)
const name = ref('')

function startEdit() {
  name.value = ''
  editing.value = true // v-if 从 false 变 true 会重新挂载，v-focus 再次执行
}
</script>

<template>
  <UInput v-if="editing" v-focus v-model="name" placeholder="编辑名称" />
  <button v-else @click="startEdit">点击编辑</button>
</template>
```

`UInput` 的根元素是包含 `<input>` 的 `div`，`v-focus` 写在 `<UInput>` 上会聚焦其内部原生 `<input>`。注意 `UInput` 传 `readonly` 时根元素不渲染，指令无效。

### 全局注册后在任意组件直接使用

```ts
// src/main.ts
import { createApp } from 'vue'
import { vFocus } from '@veltra/directives'
import App from './App.vue'

const app = createApp(App)
app.directive('focus', vFocus)
app.mount('#app')
```

```vue
<!-- src/views/Login.vue：全局注册后无需 import 指令 -->
<script setup lang="ts">
import { ref } from 'vue'

const account = ref('')
</script>

<template>
  <form>
    <input v-focus v-model="account" placeholder="进入登录页自动聚焦" />
  </form>
</template>
```

## 注意事项

> [!WARNING]
> - 本库指令从 `@veltra/directives` 导入（`import { vFocus } from '@veltra/directives'`），不是 Vue 内置指令；Vue 3 没有内置 `v-focus`。禁止写成 `import { vFocus } from 'vue'`。
> - 只匹配 `<input>` 标签：`<textarea>` 不会被聚焦，且会触发警告 `v-focus 指令需要一个 input 元素`。
> - 仅 `mounted` 时执行一次；数据更新导致组件重渲染（`updated`）不会重新聚焦。需要再次聚焦时用 `v-if` / `:key` 让元素重新挂载。
> - `focus()` 在 `mounted` 中同步调用。元素或其父级处于 `display: none`、未挂载完成时，浏览器忽略 `focus()` 调用，不报错也不聚焦。
> - 与 HTML 原生 `autofocus` 属性不同：`autofocus` 只在整页加载时生效，`v-focus` 在每次元素挂载时生效。
> - 局部导入时指令名为 `vFocus`，模板写 `v-focus`；两种写法指向同一个指令对象，不要在模板里写 `v-vFocus`。

## 常见问题

### 控制台输出 `v-focus 指令需要一个 input 元素`

原因：绑定元素不是 `<input>`，且其后代中没有 `<input>`（例如指令放在只含 `<textarea>` 或 `<button>` 的容器上）。修复：把指令移到 `<input>` 元素本身，或放在确实包含 `<input>` 的容器上：

```vue
<script setup lang="ts">
import { vFocus } from '@veltra/directives'
</script>

<template>
  <!-- 错误：容器内没有 input，触发警告 -->
  <!-- <div v-focus><textarea></textarea></div> -->

  <!-- 正确：直接作用于 input -->
  <input v-focus />
</template>
```

### 元素挂载了但没有获得焦点

按顺序排查两种原因：

1. 元素不可见：`display: none` 的元素 `focus()` 被浏览器忽略。等元素可见后再挂载：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vFocus } from '@veltra/directives'

const visible = ref(false)

// 先让容器可见，再在下一帧挂载带 v-focus 的 input
function open() {
  visible.value = true
}
</script>

<template>
  <div v-show="visible">
    <input v-if="visible" v-focus />
  </div>
  <button @click="open">打开</button>
</template>
```

2. 全局与局部注册冲突被覆盖：`app.directive('focus', ...)` 后一次注册覆盖前一次。只保留一处注册。
