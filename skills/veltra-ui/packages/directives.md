# @veltra/directives

Vue 3 自定义指令。包含 3 个指令：`vRipple`、`vClickOutside`、`vFocus`。

## 导入

```ts
import { vRipple, vClickOutside, vFocus } from '@veltra/directives'

// 样式副作用入口（波纹指令需要）
import '@veltra/directives/ripple/style'
```

### 子路径

| 子路径 | 内容 |
|--------|------|
| `@veltra/directives` | 全部 3 个指令 |
| `@veltra/directives/ripple/style` | 波纹动画样式 |

---

## `vRipple` — 水波纹

点击时产生水波纹扩散效果。`ObjectDirective<HTMLElement>`。

### 用法

```vue
<script setup lang="ts">
import { vRipple } from '@veltra/directives'
import '@veltra/directives/ripple/style'
</script>

<template>
  <!-- 默认波纹 -->
  <button v-ripple>点击我</button>

  <!-- 自定义波纹 CSS 类名 -->
  <button v-ripple="'custom-ripple-class'">自定义样式</button>

  <!-- 禁用波纹 -->
  <button v-ripple="false">无波纹</button>

  <!-- 自定义持续时间（通过 binding.arg 传入毫秒数） -->
  <button v-ripple:300="'primary-ripple'">300ms 波纹</button>
  <button v-ripple:500>500ms 波纹</button>
  <button v-ripple:1000>1000ms 波纹</button>
</template>
```

### API

| 绑定 | 类型 | 说明 |
|------|------|------|
| `binding.value` | `string \| false \| undefined` | `string`：自定义波纹元素的 CSS 类名；`false`：禁用波纹；不传：默认样式 |
| `binding.arg` | `string \| undefined` | 波纹动画持续时间（毫秒），不传则使用默认值 |

### 实际组件中的用法

```vue
<script setup lang="ts">
import { vRipple } from '@veltra/directives'
</script>

<template>
  <u-button v-ripple type="primary">按钮</u-button>
</template>
```

`UButton` 已在源码中内置 `v-ripple`，用户无需手动添加。

### 样式自定义

```css
.u-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
```

通过 `binding.value` 传入自定义类名可替换 `.u-ripple` 的默认样式。

---

## `vClickOutside` — 点击外部

监听目标元素外部的点击事件。`ObjectDirective<HTMLElement>`。

### 用法

```vue
<script setup lang="ts">
import { vClickOutside } from '@veltra/directives'

function handleClickOutside(e: MouseEvent) {
  console.log('点击了外部')
}
</script>

<template>
  <!-- value 传入回调函数 -->
  <div v-click-outside="handleClickOutside">
    点击这个 div 外部会触发回调
  </div>
</template>
```

### 下拉菜单典型用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vClickOutside } from '@veltra/directives'

const visible = ref(false)

function close() {
  visible.value = false
}
</script>

<template>
  <div class="dropdown">
    <button @click="visible = !visible">菜单</button>
    <ul v-if="visible" v-click-outside="close" class="dropdown-menu">
      <li>选项 1</li>
      <li>选项 2</li>
    </ul>
  </div>
</template>
```

### 实现细节

- 使用 `document` 级 `mousedown` + `click` 事件委托
- 通过 `createIncrease` 生成唯一 ID 管理多个实例
- `mousedown` 和 `click` 是同一 target 时才触发回调（防止从内部拖拽到外部触发）
- 元素 `unmount` 时自动清理事件监听

### API

| 绑定 | 类型 | 说明 |
|------|------|------|
| `binding.value` | `(e: MouseEvent) => void` | 点击外部时的回调函数 |

---

## `vFocus` — 自动聚焦

元素挂载时自动聚焦。`ObjectDirective<HTMLElement>`。

### 用法

```vue
<script setup lang="ts">
import { vFocus } from '@veltra/directives'
</script>

<template>
  <!-- 页面加载时自动聚焦这个 input -->
  <input v-focus placeholder="自动聚焦" />

  <!-- 条件自动聚焦 -->
  <input v-if="showInput" v-focus placeholder="弹窗中的输入框" />
</template>
```

### 对话框中的应用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { vFocus } from '@veltra/directives'

const visible = ref(false)
</script>

<template>
  <u-dialog v-model:visible="visible" title="新建">
    <!-- 对话框打开时自动聚焦 -->
    <u-input v-focus v-model="name" placeholder="请输入名称" />
  </u-dialog>
</template>
```

### API

`vFocus` 不接受任何参数，仅在 `mounted` 钩子中调用 `el.focus()`。

---

## 全局注册

```ts
// main.ts
import { createApp } from 'vue'
import { vRipple, vClickOutside, vFocus } from '@veltra/directives'
import '@veltra/directives/ripple/style'

const app = createApp(App)

app.directive('ripple', vRipple)
app.directive('click-outside', vClickOutside)
app.directive('focus', vFocus)

app.mount('#app')
```

使用 `@veltra/desktop` 的 `app.use(UltraUI)` 会自动注册全部指令。

---

## 相关文档

- desktop/components/button.md — Button 组件内置 `v-ripple`
- desktop/components/dialog.md — Dialog 中常用 `v-click-outside`

