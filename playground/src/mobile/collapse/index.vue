<template>
  <div class="demo">
    <section>
      <h3>基础折叠（v-model 数组）</h3>
      <UCollapse v-model="actives">
        <UCollapseItem
          v-for="item of basicItems"
          :key="item.value"
          :value="item.value"
          :title="item.title"
        >
          {{ item.content }}
        </UCollapseItem>
      </UCollapse>
      <p class="note">展开项：{{ actives.join('、') || '无' }}</p>
    </section>

    <section>
      <h3>手风琴模式</h3>
      <UCollapse v-model="accordionValue" accordion>
        <UCollapseItem value="1" title="第一项">
          <p>一次只能展开一项</p>
        </UCollapseItem>
        <UCollapseItem value="2" title="第二项">
          <p>展开其它项会自动收起当前项</p>
        </UCollapseItem>
        <UCollapseItem value="3" title="第三项（禁用）" disabled>
          <p>禁用项不可展开</p>
        </UCollapseItem>
      </UCollapse>
    </section>

    <section>
      <h3>默认折叠全部</h3>
      <UCollapse default-collapse-all>
        <UCollapseItem value="a" title="默认收起 A">
          <p>defaultCollapseAll 开启时不自动展开</p>
        </UCollapseItem>
        <UCollapseItem value="b" title="默认收起 B">
          <p>点击标题展开</p>
        </UCollapseItem>
      </UCollapse>
    </section>

    <section>
      <h3>自定义标题插槽</h3>
      <UCollapse v-model="slotActive">
        <UCollapseItem value="s">
          <template #header="{ isActive }">
            <span>自定义标题</span>
            <span class="hint">{{ isActive ? '（已展开）' : '（已收起）' }}</span>
          </template>
          <p>标题区经 #header 插槽自定义，展开图标保留</p>
        </UCollapseItem>
      </UCollapse>
    </section>

    <section>
      <h3>独立使用（无父容器 v-model）</h3>
      <UCollapseItem v-model="standalone" title="独立面板">
        <p>单独使用 UCollapseItem，经自身 v-model 管理展开状态</p>
      </UCollapseItem>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { UCollapse, UCollapseItem } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/collapse/style'

const basicItems = [
  { value: '1', title: '订单管理', content: '查看全部订单、待付款与待收货。' },
  { value: '2', title: '地址管理', content: '新增、编辑与删除收货地址。' },
  { value: '3', title: '账号安全', content: '修改密码、绑定手机与实名信息。' }
]

const actives = shallowRef<(string | number)[]>(['1'])
const accordionValue = shallowRef<string | number | (string | number)[]>('1')
const slotActive = shallowRef<(string | number)[]>([])

const standalone = shallowRef(false)
</script>

<style lang="scss" scoped>
// 375px 手机视口宽度内呈现，验证标题触控热区高度
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
}

.note {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--u-text-color-secondary);
}

.hint {
  font-size: 12px;
  color: var(--u-text-color-secondary);
}

p {
  margin: 0;
}
</style>
