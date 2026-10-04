<template>
  <div class="demo">
    <section>
      <h3>基础用法</h3>
      <div class="row">
        <UButton type="primary" @click="visible.basic = true">打开对话框</UButton>
      </div>

      <UDialog v-model="visible.basic" title="通知">
        <p>移动端对话框以居中卡片呈现，宽度与高度均受视口约束。</p>
        <p>点击遮罩或右上角关闭按钮即可关闭。</p>
        <template #footer>
          <UButton @click="visible.basic = false">取消</UButton>
          <UButton type="primary" @click="visible.basic = false">确定</UButton>
        </template>
      </UDialog>
    </section>

    <section>
      <h3>尺寸</h3>
      <div class="row">
        <UButton v-for="item of sizes" :key="item.size" @click="openSize(item.size)">
          {{ item.text }}
        </UButton>
      </div>

      <UDialog v-model="visible.size" :size="currentSize" :title="`${currentSize} 尺寸`">
        <p>小 / 中 / 大对应不同的卡片宽度上限与标题密度。</p>
      </UDialog>
    </section>

    <section>
      <h3>全屏</h3>
      <div class="row">
        <UButton type="primary" @click="visible.fullscreen = true">全屏对话框</UButton>
      </div>

      <UDialog v-model="visible.fullscreen" fullscreen title="全屏">
        <p>铺满视口的全屏形态，内容超高时在卡片内滚动。</p>
        <p v-for="i in 16" :key="i">第 {{ i }} 行内容</p>
        <template #footer>
          <UButton type="primary" @click="visible.fullscreen = false">关闭</UButton>
        </template>
      </UDialog>
    </section>

    <section>
      <h3>长内容</h3>
      <div class="row">
        <UButton @click="visible.long = true">打开长内容</UButton>
      </div>

      <UDialog v-model="visible.long" title="长内容">
        <p>卡片高度上限为视口的 86%，超出部分在内容区滚动。</p>
        <p v-for="i in 24" :key="i">第 {{ i }} 行内容</p>
      </UDialog>
    </section>

    <section>
      <h3>非模态</h3>
      <div class="row">
        <UButton @click="visible.nonModal = true">打开非模态</UButton>
      </div>

      <UDialog v-model="visible.nonModal" :modal="false" header="非模态对话框">
        <p>无遮罩且点击空白处不关闭，使用右上角按钮关闭。</p>
      </UDialog>
    </section>

    <section>
      <h3>触发器插槽</h3>
      <UDialog v-model="visible.trigger" title="触发器">
        <p>点击触发器在打开 / 关闭间切换。</p>
        <template #trigger>
          <UButton type="primary">触发器按钮</UButton>
        </template>
      </UDialog>
    </section>

    <section>
      <h3>关闭事件</h3>
      <div class="row">
        <UButton @click="visible.events = true">打开</UButton>
        <span class="hint">closed 触发 {{ closedCount }} 次</span>
      </div>

      <UDialog v-model="visible.events" title="事件" @closed="closedCount++">
        <p>完全关闭（退场动画结束）后触发 closed 事件。</p>
      </UDialog>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UDialog } from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/dialog/style'

const visible = reactive({
  basic: false,
  size: false,
  fullscreen: false,
  long: false,
  nonModal: false,
  trigger: false,
  events: false
})

const sizes = [
  { size: 'small', text: '小' },
  { size: 'default', text: '中' },
  { size: 'large', text: '大' }
] as const

const currentSize = shallowRef<'small' | 'default' | 'large'>('default')

function openSize(size: 'small' | 'default' | 'large') {
  currentSize.value = size
  visible.size = true
}

const closedCount = shallowRef(0)
</script>

<style lang="scss" scoped>
// 手机设备外壳视口内呈现，验证移动端密度与触控热区
.demo {
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--u-text-color-title);
  }

  p {
    margin: 0 0 8px;
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}
</style>
