<template>
  <div class="demo">
    <section>
      <h3>底部抽屉（默认方位）</h3>
      <div class="row">
        <UButton type="primary" @click="visible.basic = true">打开底部抽屉</UButton>
        <span class="hint">close {{ closeCount }} 次 / closed {{ closedCount }} 次</span>
      </div>
      <p class="hint">不传 placement 即底部面板；打开期间背景不可滚动，关闭后回到原滚动位置。</p>

      <UDrawer
        v-model="visible.basic"
        title="底部抽屉"
        show-close
        @close="closeCount++"
        @closed="closedCount++"
      >
        <p>按住顶部把手向下拖拽可关闭，松手前面板实时跟随。</p>
        <p>点击遮罩或右上角关闭按钮同样可以关闭。</p>
        <div class="row">
          <UButton @click="visible.basic = false">取消</UButton>
          <UButton type="primary" @click="visible.basic = false">确定</UButton>
        </div>
      </UDrawer>
    </section>

    <section>
      <h3>四向边缘拖拽</h3>
      <div class="row">
        <UButton v-for="dir of placements" :key="dir" @click="openPlacement(dir)">
          {{ placementText[dir] }}
        </UButton>
      </div>
      <p class="hint">四个方位均可沿对应方向拖拽内沿把手关闭：左拖 / 右拖 / 上推 / 下拉。</p>

      <UDrawer
        v-for="dir of placements"
        :key="dir"
        v-model="visible[dir]"
        :placement="dir"
        :title="`${placementText[dir]}抽屉`"
      >
        <p>从{{ placementText[dir] }}滑入的抽屉。</p>
        <p class="hint">{{ dragHint[dir] }}</p>
      </UDrawer>
    </section>

    <section>
      <h3>无标题</h3>
      <div class="row">
        <UButton @click="visible.plain = true">仅关闭按钮</UButton>
      </div>

      <UDrawer v-model="visible.plain" show-close>
        <p>不传 title 时不渲染标题栏；showClose 单独控制关闭按钮。</p>
      </UDrawer>
    </section>

    <section>
      <h3>长内容</h3>
      <div class="row">
        <UButton @click="visible.long = true">打开长内容</UButton>
      </div>

      <UDrawer v-model="visible.long" title="长内容">
        <p>面板高度上限为视口的 70%，超出部分在内容区滚动。</p>
        <p v-for="i in 24" :key="i">第 {{ i }} 行内容</p>
      </UDrawer>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UDrawer } from '@veltra/mobile'
import type { DrawerPlacement } from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/button/style'
import '@veltra/mobile/components/drawer/style'

const visible = reactive({
  basic: false,
  left: false,
  right: false,
  top: false,
  bottom: false,
  plain: false,
  long: false
})

const placements = ['left', 'right', 'top', 'bottom'] as const

const placementText: Record<DrawerPlacement, string> = {
  left: '左侧',
  right: '右侧',
  top: '顶部',
  bottom: '底部'
}

const dragHint: Record<DrawerPlacement, string> = {
  bottom: '按住顶部横把手向下拖拽关闭。',
  top: '按住底部横把手向上推关闭。',
  left: '按住右内沿中部竖把手向左拖关闭。',
  right: '按住左内沿中部竖把手向右拖关闭。'
}

function openPlacement(dir: (typeof placements)[number]) {
  visible[dir] = true
}

const closeCount = shallowRef(0)
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
