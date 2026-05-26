# @veltra/directives

Vue 3 自定义指令，共 3 个：`vRipple` / `vClickOutside` / `vFocus`。`v-loading` 由 `@veltra/desktop` 提供（见 `desktop/components/loading.md`）。

## 导入

```ts
import { vRipple, vClickOutside, vFocus } from '@veltra/directives'
import '@veltra/directives/ripple/style'  // vRipple 需要的样式副作用
```

`app.use(UltraUI)` 已自动注册以上指令；按需使用时手动 import 并在模板使用即可。

## `vRipple` — 水波纹

点击产生扩散效果。

```vue
<button v-ripple>默认波纹</button>
<button v-ripple="'custom-ripple-class'">自定义类名</button>
<button v-ripple="false">禁用</button>
<button v-ripple:300>300ms 持续时间</button>
<button v-ripple:500="'primary-ripple'">500ms + 自定义类</button>
```

| 绑定            | 类型                           | 说明                                          |
| --------------- | ------------------------------ | --------------------------------------------- |
| `binding.value` | `string \| false \| undefined` | 自定义类名 / `false` 禁用 / 不传用默认        |
| `binding.arg`   | `string \| undefined`          | 持续时间（毫秒），不传用默认                  |

`UButton` 内部已内置 `v-ripple`，无需手动添加。

## `vClickOutside` — 点击外部

监听元素外部 `mousedown` + `click`（同 target 时才触发，防拖拽误触）。

```vue
<script setup lang="ts">
import { vClickOutside } from '@veltra/directives'
import { ref } from 'vue'

const visible = ref(false)
</script>

<template>
  <div>
    <button @click="visible = !visible">菜单</button>
    <ul v-if="visible" v-click-outside="() => visible = false">
      <li>选项 1</li>
    </ul>
  </div>
</template>
```

| 绑定            | 类型                      | 说明                 |
| --------------- | ------------------------- | -------------------- |
| `binding.value` | `(e: MouseEvent) => void` | 点击外部时的回调     |

## `vFocus` — 自动聚焦

`mounted` 时调用 `el.focus()`，无参数。

```vue
<input v-focus placeholder="自动聚焦" />

<u-dialog v-model="visible" title="新建">
  <u-input v-focus v-model="name" />
</u-dialog>
```

## 全局注册

```ts
import { vRipple, vClickOutside, vFocus } from '@veltra/directives'
import '@veltra/directives/ripple/style'

app.directive('ripple', vRipple)
app.directive('click-outside', vClickOutside)
app.directive('focus', vFocus)
```

`@veltra/desktop/install` 的 `app.use(UltraUI)` 会一次性注册这 3 个指令以及 `v-loading`。
