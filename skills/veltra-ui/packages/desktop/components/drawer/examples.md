# UDrawer 示例

## 基础用法 — 右侧抽屉

```vue
<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
</script>

<template>
  <u-button @click="visible = true">打开抽屉</u-button>
  <u-drawer v-model="visible" title="用户详情">
    <p>这里是抽屉的主体内容。</p>
  </u-drawer>
</template>
```

## 左侧导航抽屉

```vue
<script setup lang="ts">
import { ref } from 'vue'

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

## 底部抽屉 + 监听事件

```vue
<script setup lang="ts">
import { ref } from 'vue'
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

## 顶部提示抽屉

```vue
<script setup lang="ts">
import { ref } from 'vue'

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
