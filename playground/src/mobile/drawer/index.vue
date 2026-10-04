<template>
  <div class="demo">
    <section>
      <h3>底部抽屉</h3>
      <div class="row">
        <UButton type="primary" @click="visible.basic = true">打开底部抽屉</UButton>
        <span class="hint">close {{ closeCount }} 次 / closed {{ closedCount }} 次</span>
      </div>

      <UDrawer
        v-model="visible.basic"
        direction="bottom"
        title="底部抽屉"
        show-close
        @close="closeCount++"
        @closed="closedCount++"
      >
        <p>移动端抽屉呈现为底部面板，按住顶部把手下拉可关闭。</p>
        <p>点击遮罩或右上角关闭按钮同样可以关闭。</p>
        <div class="row">
          <UButton @click="visible.basic = false">取消</UButton>
          <UButton type="primary" @click="visible.basic = false">确定</UButton>
        </div>
      </UDrawer>
    </section>

    <section>
      <h3>方向</h3>
      <div class="row">
        <UButton v-for="dir of directions" :key="dir" @click="openDirection(dir)">
          {{ directionText[dir] }}
        </UButton>
      </div>

      <UDrawer
        v-for="dir of directions"
        :key="dir"
        v-model="visible[dir]"
        :direction="dir"
        :title="`${directionText[dir]}抽屉`"
      >
        <p>从{{ directionText[dir] }}滑入的抽屉。</p>
      </UDrawer>
    </section>

    <section>
      <h3>无标题</h3>
      <div class="row">
        <UButton @click="visible.plain = true">仅关闭按钮</UButton>
      </div>

      <UDrawer v-model="visible.plain" direction="bottom" show-close>
        <p>不传 title 时不渲染标题栏；showClose 单独控制关闭按钮。</p>
      </UDrawer>
    </section>

    <section>
      <h3>长内容</h3>
      <div class="row">
        <UButton @click="visible.long = true">打开长内容</UButton>
      </div>

      <UDrawer v-model="visible.long" direction="bottom" title="长内容">
        <p>面板高度上限为视口的 70%，超出部分在内容区滚动。</p>
        <p v-for="i in 24" :key="i">第 {{ i }} 行内容</p>
      </UDrawer>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UButton, UDrawer } from '@veltra/mobile'
import type { DrawerDirection } from '@veltra/mobile'
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

const directions = ['left', 'right', 'top', 'bottom'] as const

const directionText: Record<DrawerDirection, string> = {
  left: '左侧',
  right: '右侧',
  top: '顶部',
  bottom: '底部'
}

function openDirection(dir: (typeof directions)[number]) {
  visible[dir] = true
}

const closeCount = shallowRef(0)
const closedCount = shallowRef(0)
</script>

<style lang="scss" scoped>
// 375px 手机视口宽度内呈现，验证移动端密度与触控热区
.demo {
  max-width: 375px;
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
