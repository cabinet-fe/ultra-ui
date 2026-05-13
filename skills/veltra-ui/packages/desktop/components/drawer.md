# UDrawer — 抽屉

> `import type { DrawerProps, DrawerEmits, DrawerExposed, DrawerDirection, DrawerMode } from '@veltra/desktop'`

## Import

```ts
import { UDrawer } from '@veltra/desktop'
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `boolean` | `false` | 是否显示抽屉 |
| `direction` | `DrawerDirection` \| `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | 抽屉滑出方向 |
| `showClose` | `boolean` | — | 是否在右上角显示关闭按钮（X 图标） |
| `title` | `string` | — | 抽屉标题（当前未在模板中渲染，由 slot 自行处理） |

> 注：`withDefaults` 中设置了 `closable: true`，但该属性未在 `DrawerProps` 类型中声明，也未在组件逻辑中使用，可能为遗留代码。

## Emits

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `(value: boolean)` | `v-model` 双向绑定更新 |
| `close` | — | 点击关闭按钮或遮罩层时触发（在滑出动画开始前） |
| `closed` | — | 抽屉完全关闭且过渡动画结束后触发（类型已声明，当前代码中尚未 emit） |

## Slots

| 插槽 | 说明 |
|------|------|
| `default` | 抽屉主体内容，完全由调用方自定义 |

## Exposed

无暴露属性或方法。

## 行为说明

- 抽屉通过 `<Teleport to="body">` 挂载到 `document.body`。
- 开启时先以 `fade` 过渡显示遮罩层，遮罩 `@enter` 后再触发抽屉面板的滑入过渡。
- 关闭时先滑出面板，`@after-leave` 后再隐藏遮罩层。
- 遮罩层 `zIndex` 由 `@veltra/utils` 的 `zIndex()` 按调用顺序自动递增管理。
- 点击遮罩层会触发关闭，面板内点击通过 `@click.stop` 阻止冒泡。
- `v-bind="$attrs"` 透传至抽屉面板 DOM 元素，`inheritAttrs: false`。

### 过渡动画 CSS 类

遮罩层依赖 `drawer-overlay` BEM 块 + `fade` 过渡类。抽屉面板依赖 `drawer-slide-{direction}` 过渡类：

| 方向 | 过渡类名 |
|------|----------|
| `left` | `drawer-slide-left` |
| `right` | `drawer-slide-right` |
| `top` | `drawer-slide-top` |
| `bottom` | `drawer-slide-bottom` |

## Examples

### 基础用法 — 右侧抽屉

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UDrawer } from '@veltra/desktop'

const visible = ref(false)
</script>

<template>
  <u-button @click="visible = true">打开抽屉</u-button>
  <u-drawer v-model="visible" title="用户详情">
    <p>这里是抽屉的主体内容。</p>
  </u-drawer>
</template>
```

### 左侧导航抽屉

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UDrawer } from '@veltra/desktop'

const menuVisible = ref(false)
</script>

<template>
  <u-button @click="menuVisible = true">菜单</u-button>
  <u-drawer v-model="menuVisible" direction="left" show-close>
    <nav>
      <ul>
        <li>首页</li>
        <li>关于</li>
        <li>联系</li>
      </ul>
    </nav>
  </u-drawer>
</template>
```

### 底部抽屉 + 监听事件

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UDrawer } from '@veltra/desktop'
import type { DrawerEmits } from '@veltra/desktop'

const pickerVisible = ref(false)

const onClose: DrawerEmits['close'] = () => {
  console.log('抽屉开始关闭')
}

const onClosed: DrawerEmits['closed'] = () => {
  console.log('抽屉已完全关闭')
}
</script>

<template>
  <u-button @click="pickerVisible = true">选择</u-button>
  <u-drawer
    v-model="pickerVisible"
    direction="bottom"
    show-close
    @close="onClose"
    @closed="onClosed"
  >
    <div class="picker-content">
      <p>选项 A</p>
      <p>选项 B</p>
      <p>选项 C</p>
    </div>
  </u-drawer>
</template>
```

### 顶部提示抽屉

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UDrawer } from '@veltra/desktop'

const noticeVisible = ref(false)
</script>

<template>
  <u-button type="text" @click="noticeVisible = true">🔔 查看通知</u-button>
  <u-drawer v-model="noticeVisible" direction="top">
    <div class="notice">
      <h3>系统通知</h3>
      <p>您有 3 条新消息。</p>
    </div>
  </u-drawer>
</template>
```
