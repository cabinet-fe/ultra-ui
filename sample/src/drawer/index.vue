<template>
  <div class="demo-drawer">
    <h2>抽屉组件 Drawer</h2>

    <div class="demo-section">
      <h3>基础用法</h3>
      <u-button @click="basicVisible = true">打开抽屉</u-button>
      <u-drawer v-model="basicVisible" title="基础抽屉">
        <p>这是抽屉的内容区域。</p>
        <p>您可以在这里放置任何内容。</p>
        <template #footer>
          <u-button @click="basicVisible = false">取消</u-button>
          <u-button type="primary" @click="basicVisible = false">确定</u-button>
        </template>
      </u-drawer>
    </div>

    <div class="demo-section">
      <h3>不同方向</h3>
      <u-button @click="leftVisible = true">左侧抽屉</u-button>
      <u-button @click="rightVisible = true">右侧抽屉</u-button>
      <u-button @click="topVisible = true">顶部抽屉</u-button>
      <u-button @click="bottomVisible = true">底部抽屉</u-button>

      <u-drawer
        v-model="leftVisible"
        direction="left"
        title="左侧抽屉"
        :size="300"
      >
        <p>这是从左侧弹出的抽屉</p>
      </u-drawer>

      <u-drawer
        v-model="rightVisible"
        direction="right"
        title="右侧抽屉"
        :size="400"
      >
        <p>这是从右侧弹出的抽屉</p>
      </u-drawer>

      <u-drawer
        v-model="topVisible"
        direction="top"
        title="顶部抽屉"
        :size="200"
      >
        <p>这是从顶部弹出的抽屉</p>
      </u-drawer>

      <u-drawer
        v-model="bottomVisible"
        direction="bottom"
        title="底部抽屉"
        :size="250"
      >
        <p>这是从底部弹出的抽屉</p>
      </u-drawer>
    </div>

    <div class="demo-section">
      <h3>不同模式</h3>
      <u-button @click="edgeVisible = true">贴边模式</u-button>
      <u-button @click="insetVisible = true">留边距模式</u-button>

      <u-drawer v-model="edgeVisible" mode="edge" title="贴边模式">
        <p>这是贴边模式的抽屉，完全贴合屏幕边缘</p>
      </u-drawer>

      <u-drawer v-model="insetVisible" mode="inset" title="留边距模式">
        <p>这是留边距模式的抽屉，与屏幕边缘有一定距离</p>
      </u-drawer>
    </div>

    <div class="demo-section">
      <h3>自定义配置</h3>
      <u-button @click="customVisible = true">自定义抽屉</u-button>

      <u-drawer
        v-model="customVisible"
        :size="500"
        :mask-closable="false"
        :closable="false"
        title="自定义抽屉"
      >
        <template #header>
          <div style="color: #1890ff; font-weight: bold">自定义头部内容</div>
        </template>

        <div>
          <p>这是一个自定义配置的抽屉：</p>
          <ul>
            <li>宽度设置为 500px</li>
            <li>点击遮罩层不会关闭</li>
            <li>不显示关闭按钮</li>
            <li>自定义头部内容</li>
          </ul>
        </div>

        <template #footer>
          <div style="text-align: right">
            <u-button @click="customVisible = false" style="margin-right: 8px"
              >取消</u-button
            >
            <u-button type="primary" @click="customVisible = false"
              >确定</u-button
            >
          </div>
        </template>
      </u-drawer>
    </div>

    <div class="demo-section">
      <h3>无遮罩层</h3>
      <u-button @click="noModalVisible = true">无遮罩抽屉</u-button>

      <u-drawer v-model="noModalVisible" :modal="false" title="无遮罩抽屉">
        <p>这个抽屉没有遮罩层，您仍然可以与页面其他部分交互。</p>
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
const edgeVisible = ref(false)
const insetVisible = ref(false)
const customVisible = ref(false)
const noModalVisible = ref(false)
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
