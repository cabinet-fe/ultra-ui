<template>
  <div class="demo">
    <section>
      <h3>基础用法</h3>
      <div class="row">
        <UButton type="primary" @click="visible.basic = true">打开对话框</UButton>
      </div>

      <UDialog v-model="visible.basic" title="通知" @confirm="confirmCount++">
        <p>移动端对话框为 NutUI 惯例居中卡片：标题与正文居中。</p>
        <p>footer 是水平按钮组，主操作居右、操作区高度不低于 44px。</p>
      </UDialog>
      <p class="hint">confirm {{ confirmCount }} 次</p>
    </section>

    <section>
      <h3>滚动锁定</h3>
      <div class="row">
        <UButton @click="visible.lock = true">打开后滚动背景</UButton>
      </div>
      <p class="hint">打开期间背景页面不可滚动，完全关闭后回到原滚动位置。</p>

      <UDialog v-model="visible.lock" title="滚动锁定" confirm-text="知道了" :show-cancel="false">
        <p>把本页滚动到中间再打开：关闭后页面停回原处。</p>
      </UDialog>
    </section>

    <section>
      <h3>按钮组形态</h3>
      <div class="row">
        <UButton @click="visible.vertical = true">纵向堆叠</UButton>
        <UButton @click="visible.onlyConfirm = true">仅确认</UButton>
        <UButton @click="visible.customText = true">自定义文字</UButton>
      </div>

      <UDialog v-model="visible.vertical" title="清除缓存" vertical-actions>
        <p>多操作或长文案场景可把按钮组改为纵向堆叠。</p>
      </UDialog>

      <UDialog v-model="visible.onlyConfirm" title="公告" :show-cancel="false">
        <p>show-cancel 为 false 时只渲染确认按钮。</p>
      </UDialog>

      <UDialog
        v-model="visible.customText"
        title="删除确认"
        confirm-text="删除"
        cancel-text="再想想"
        @cancel="cancelCount++"
      >
        <p>确认与取消文字分别由 confirm-text / cancel-text 指定。</p>
      </UDialog>
    </section>

    <section>
      <h3>footer 插槽</h3>
      <div class="row">
        <UButton @click="visible.slot = true">自定义 footer</UButton>
        <span class="hint">cancel {{ cancelCount }} 次</span>
      </div>

      <UDialog v-model="visible.slot" title="自定义按钮" content-align="left">
        <p>传入 #footer 插槽时按钮组整体由插槽接管，仍按等宽铺满布局。</p>
        <p>content-align="left" 可把正文切为左对齐（表单等场景）。</p>
        <template #footer>
          <UButton @click="visible.slot = false">取消</UButton>
          <UButton type="primary" @click="visible.slot = false">确定</UButton>
        </template>
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
      <h3>触发器插槽与关闭事件</h3>
      <UDialog v-model="visible.trigger" title="触发器" @closed="closedCount++">
        <p>点击触发器在打开 / 关闭间切换；完全关闭后触发 closed 事件。</p>
        <template #trigger>
          <UButton type="primary">触发器按钮</UButton>
        </template>
      </UDialog>
      <p class="hint">closed 触发 {{ closedCount }} 次</p>
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
  lock: false,
  vertical: false,
  onlyConfirm: false,
  customText: false,
  slot: false,
  fullscreen: false,
  long: false,
  nonModal: false,
  trigger: false
})

const confirmCount = shallowRef(0)
const cancelCount = shallowRef(0)
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
