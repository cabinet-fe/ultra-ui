<template>
  <div class="demo-drawer">
    <h2>抽屉组件 Drawer</h2>

    <div class="demo-section">
      <h3>基础用法</h3>
      <u-button @click="basicVisible = true" type="primary">打开抽屉</u-button>
      <u-drawer v-model="basicVisible" title="基础抽屉">
        <p>这是抽屉的内容区域。</p>
        <p>您可以在这里放置任何内容。</p>
      </u-drawer>
    </div>

    <div class="demo-section">
      <h3>不同方向</h3>
      <u-button @click="leftVisible = true" type="primary">左侧抽屉</u-button>
      <u-button @click="rightVisible = true" type="primary">右侧抽屉</u-button>
      <u-button @click="topVisible = true" type="primary">顶部抽屉</u-button>
      <u-button @click="bottomVisible = true" type="primary">底部抽屉</u-button>

      <u-drawer v-model="leftVisible" direction="left" title="左侧抽屉" :size="300">
        <p>这是从左侧弹出的抽屉</p>
      </u-drawer>

      <u-drawer v-model="rightVisible" direction="right" title="右侧抽屉" :size="400">
        <p>这是从右侧弹出的抽屉</p>
      </u-drawer>

      <u-drawer v-model="topVisible" direction="top" title="顶部抽屉" :size="200">
        <p>这是从顶部弹出的抽屉</p>
      </u-drawer>

      <u-drawer v-model="bottomVisible" direction="bottom" title="底部抽屉" :size="250">
        <p>这是从底部弹出的抽屉</p>
      </u-drawer>
    </div>

    <div class="demo-section">
      <h3>自定义配置</h3>
      <u-button @click="customVisible = true" type="primary">自定义抽屉</u-button>

      <u-drawer
        v-model="customVisible"
        :size="500"
        :show-close="false"
        title="自定义抽屉（size: 500）"
      >
        <div>
          <p>这是一个自定义配置的抽屉：</p>
          <ul>
            <li>宽度设置为 500px</li>
            <li>不显示关闭按钮</li>
            <li>内容区自带留白，多段内容不贴边</li>
          </ul>
        </div>
      </u-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 各种抽屉的显示状态
const basicVisible = ref(false)
const leftVisible = ref(false)
const rightVisible = ref(false)
const topVisible = ref(false)
const bottomVisible = ref(false)
const customVisible = ref(false)
</script>

<style scoped>
.demo-drawer {
  padding: 20px;
}

.demo-section {
  margin-bottom: 40px;
}

.demo-section h3 {
  margin-bottom: 16px;
  color: #333;
}

.demo-section button {
  margin-right: 12px;
  margin-bottom: 12px;
}
</style>
