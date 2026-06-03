# @veltra/directives

Vue 3 自定义指令。

## vRipple

波纹指令。点击时可在绑定的元素内产生波纹扩散效果。

### 定义

| 绑定            | 类型                             | 说明                           |
| --------------- | -------------------------------- | ------------------------------ |
| `binding.value` | `string \| boolean \| undefined` | 自定义类名 / 指定 `false` 禁用 |
| `binding.arg`   | `string \| undefined`            | 持续时间（毫秒），不传用默认   |

### 使用示例

```vue
<template>
  <div v-ripple>默认波纹</div>
  <div v-ripple="false">禁用</div>
  <div v-ripple="'my-ripple'">自定义波纹 CSS 类</div>
  <div v-ripple:1000>自定义波纹持续时间（毫秒）</div>
</template>

<script setup>
import { vRipple } from '@veltra/directives'
import '@veltra/directives/ripple/style.js'
</script>
```

### 注意

- 按需使用指令时必须单独引入 `@veltra/directives/ripple/style.js`（或组件 `style` 入口已带入）。
- `UButton` 组件内部已内置 `v-ripple`，无需手动添加。

## vClickOutside

点击外部指令。在 document 上协调 `mousedown` 与 `click`：仅当二者 `target` 一致时才触发回调，避免拖拽松手误触。

### 定义

| 绑定            | 类型                                   | 说明                                  |
| --------------- | -------------------------------------- | ------------------------------------- |
| `binding.value` | `(e: MouseEvent) => void \| undefined` | 点击外部时的回调；传 falsy 时注销监听 |

### 使用示例

```vue
<template>
  <div>
    <button @click="visible = !visible">菜单</button>
    <ul v-if="visible" v-click-outside="() => (visible = false)">
      <li>选项 1</li>
    </ul>
  </div>
</template>

<script setup>
import { vClickOutside } from '@veltra/directives'
import { ref } from 'vue'

const visible = ref(false)
</script>
```

### 注意

- 指令应绑在需要判定“内部区域”的根节点上（如浮层容器），参考 `UTip` 的 `v-click-outside` 用法。

## vFocus

自动聚焦指令。`mounted` 时：元素自身为 `input` 则 `focus()`，否则在子树中查找第一个 `input` 并聚焦。

### 定义

| 绑定            | 类型 | 说明               |
| --------------- | ---- | ------------------ |
| `binding.value` | —    | 无参数，挂载即聚焦 |

### 使用示例

```vue
<template>
  <input v-focus placeholder="自动聚焦" />

  <u-dialog v-model="visible" title="新建">
    <u-input v-focus v-model="name" />
  </u-dialog>
</template>

<script setup>
import { vFocus } from '@veltra/directives'
import { ref } from 'vue'

const visible = ref(false)
const name = ref('')
</script>
```

### 注意

- 容器内必须存在可聚焦的 `input`；否则控制台输出 `v-focus 指令需要一个 input 元素`。
- `UInput` 等复合控件可在其根节点上使用，指令会聚焦内部原生 `input`。

## 全局注册

```ts
import { vRipple, vClickOutside, vFocus } from '@veltra/directives'
import '@veltra/directives/ripple/style.js'

app.directive('ripple', vRipple)
app.directive('click-outside', vClickOutside)
app.directive('focus', vFocus)
```
