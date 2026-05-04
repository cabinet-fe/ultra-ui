<template>
  <div class="collapse-demo">
    <CustomCard title="基本用法">
      <p class="desc">默认开启边框模式，可同时展开多个面板。</p>
      <u-collapse v-model="basicValue">
        <u-collapse-item value="design" title="设计原则">
          <p>遵循一致性、反馈性、效率性与可控性，构建用户可信赖的桌面端体验。</p>
        </u-collapse-item>
        <u-collapse-item value="navigation" title="导航模式">
          <p>顶部导航适合扁平结构，侧边导航适合层级较深的功能区，面包屑用于精确定位。</p>
        </u-collapse-item>
        <u-collapse-item value="forms" title="表单交互">
          <p>使用尺寸 token 与统一的间距系统，让表单在不同密度下保持节奏。</p>
        </u-collapse-item>
      </u-collapse>
    </CustomCard>

    <CustomCard title="手风琴模式">
      <p class="desc">同时只允许展开一项，点击当前项可重新关闭。</p>
      <u-collapse v-model="accordionValue" accordion>
        <u-collapse-item value="a" title="什么是手风琴模式？">
          <p>手风琴模式使内容互斥地展开，适合空间有限或需要聚焦阅读的场景。</p>
        </u-collapse-item>
        <u-collapse-item value="b" title="何时使用？">
          <p>在 FAQ、设置面板、文档目录等线性阅读场景中表现最佳。</p>
        </u-collapse-item>
        <u-collapse-item value="c" title="无障碍支持">
          <p>
            组件已提供 <code>role="button"</code>、<code>aria-expanded</code> 与键盘 Enter / Space
            控制。
          </p>
        </u-collapse-item>
      </u-collapse>
    </CustomCard>

    <CustomCard title="Ghost · 无边框风格">
      <p class="desc">
        通过 <code>:bordered="false"</code> 切换至无边框风格，适合卡片/对话框内嵌使用。
      </p>
      <u-collapse v-model="ghostValue" :bordered="false">
        <u-collapse-item value="g1">
          <template #title>
            <span class="title-with-icon">
              <UIcon><Star /></UIcon>
              特性概览
            </span>
          </template>
          <p>简洁、轻量、嵌入友好；hover 时浮起轻微背景。</p>
        </u-collapse-item>
        <u-collapse-item value="g2">
          <template #title>
            <span class="title-with-icon">
              <UIcon><Setting /></UIcon>
              使用建议
            </span>
          </template>
          <p>建议在容器有自身边框/分隔线时使用 ghost 风格，避免视觉嵌套。</p>
        </u-collapse-item>
      </u-collapse>
    </CustomCard>

    <CustomCard title="尺寸">
      <p class="desc">
        支持 <code>small</code> / <code>default</code> / <code>large</code> 三种尺寸，与全局尺寸
        token 联动。
      </p>
      <div class="size-grid">
        <div v-for="s of sizes" :key="s" class="size-col">
          <div class="size-tag">{{ s }}</div>
          <u-collapse v-model="sizeValue" :size="s">
            <u-collapse-item value="s1" title="标题示例">
              <p>统一尺寸节奏。</p>
            </u-collapse-item>
            <u-collapse-item value="s2" title="另一项">
              <p>跟随主题 token 同步缩放字体与间距。</p>
            </u-collapse-item>
          </u-collapse>
        </div>
      </div>
    </CustomCard>

    <CustomCard title="图标位置">
      <p class="desc">通过 <code>icon-position="left"</code> 让展开图标显示在标题前方。</p>
      <u-collapse v-model="iconLeftValue" icon-position="left" :bordered="false">
        <u-collapse-item value="l1" title="左侧图标 · 适合文档大纲">
          <p>类似 IDE 文件树的展开样式，便于在层级结构中扫读。</p>
        </u-collapse-item>
        <u-collapse-item value="l2" title="左侧图标 · 多级嵌套">
          <p>嵌套使用时左侧图标可以提供更清晰的层级线索。</p>
        </u-collapse-item>
      </u-collapse>
    </CustomCard>

    <CustomCard title="自定义展开图标">
      <p class="desc">通过 <code>:expand-icon</code> 传入图标组件，活动态会自动旋转 90°。</p>
      <u-collapse v-model="customIconValue" :expand-icon="Plus">
        <u-collapse-item value="c1" title="点击展开 / 收起">
          <p>展开图标使用 <code>Plus</code>，旋转后呈“×”视觉，无需额外动画代码。</p>
        </u-collapse-item>
        <u-collapse-item value="c2" title="或使用 #icon 插槽完全接管">
          <template #icon="{ isActive }">
            <UIcon
              :style="{
                color: isActive ? 'var(--u-color-primary)' : 'var(--u-text-color-placeholder)'
              }"
            >
              <ArrowDown v-if="isActive" />
              <ArrowRight v-else />
            </UIcon>
          </template>
          <p>插槽形式可以根据 <code>isActive</code> 状态返回不同图标，完全接管显示。</p>
        </u-collapse-item>
      </u-collapse>
    </CustomCard>

    <CustomCard title="禁用与隐藏图标">
      <u-collapse v-model="disabledValue">
        <u-collapse-item value="1" title="正常项">
          <p>该项可以正常展开 / 收起。</p>
        </u-collapse-item>
        <u-collapse-item value="2" title="禁用项" disabled>
          <p>禁用状态下点击与键盘均不会触发切换。</p>
        </u-collapse-item>
        <u-collapse-item value="3" title="隐藏图标项" hide-icon>
          <p>通过 <code>hide-icon</code> 可隐藏箭头图标，让标题更克制。</p>
        </u-collapse-item>
      </u-collapse>
    </CustomCard>

    <CustomCard title="程序化控制（exposed methods）">
      <p class="desc">
        通过 ref 调用 <code>toggle</code> / <code>expand</code> / <code>collapse</code> /
        <code>expandAll</code> / <code>collapseAll</code>。
      </p>
      <div class="actions">
        <u-button size="small" @click="collapseRef?.expand('p1')">展开 P1</u-button>
        <u-button size="small" @click="collapseRef?.collapse('p1')">收起 P1</u-button>
        <u-button size="small" type="primary" @click="collapseRef?.expandAll(['p1', 'p2', 'p3'])"
          >展开全部</u-button
        >
        <u-button size="small" plain @click="collapseRef?.collapseAll()">全部收起</u-button>
      </div>
      <u-collapse ref="collapseRef" v-model="programmaticValue" @change="onChange">
        <u-collapse-item value="p1" title="第一项">
          <p>
            当前激活值：<code>{{ JSON.stringify(programmaticValue) }}</code>
          </p>
        </u-collapse-item>
        <u-collapse-item value="p2" title="第二项">
          <p>
            change 事件参数：<code>{{ JSON.stringify(lastChange) }}</code>
          </p>
        </u-collapse-item>
        <u-collapse-item value="p3" title="第三项">
          <p>无需 v-model 也可通过实例方法操作面板。</p>
        </u-collapse-item>
      </u-collapse>
    </CustomCard>

    <CustomCard title="嵌套使用">
      <u-collapse v-model="nestValue">
        <u-collapse-item value="n1" title="@veltra/desktop">
          <u-collapse v-model="nestInner1" :bordered="false" icon-position="left">
            <u-collapse-item value="n1-1" title="组件目录">
              <p>
                每个组件位于 <code>src/components/&lt;name&gt;</code>，独立
                <code>style.scss</code>。
              </p>
            </u-collapse-item>
            <u-collapse-item value="n1-2" title="类型目录">
              <p>类型集中在 <code>src/types/&lt;name&gt;.ts</code>，与组件解耦。</p>
            </u-collapse-item>
          </u-collapse>
        </u-collapse-item>
        <u-collapse-item value="n2" title="@veltra/styles">
          <u-collapse v-model="nestInner2" :bordered="false" icon-position="left">
            <u-collapse-item value="n2-1" title="设计 token">
              <p>颜色、间距、圆角统一通过 CSS 变量提供。</p>
            </u-collapse-item>
            <u-collapse-item value="n2-2" title="主题切换">
              <p>通过 <code>UITheme</code> 实例运行时切换浅 / 深主题。</p>
            </u-collapse-item>
          </u-collapse>
        </u-collapse-item>
      </u-collapse>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import type { CollapseExposed, CollapseModelValue } from '@veltra/desktop'
import { ArrowDown, ArrowRight, Plus, Setting, Star } from '@veltra/icons/normal'
import type { ComponentSize } from '@veltra/utils'
import { ref, shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const basicValue = ref<CollapseModelValue>(['design'])
const accordionValue = ref<CollapseModelValue>('a')
const ghostValue = ref<CollapseModelValue>(['g1'])
const sizeValue = ref<CollapseModelValue>(['s1'])
const iconLeftValue = ref<CollapseModelValue>(['l1', 'l2'])
const customIconValue = ref<CollapseModelValue>(['c1'])
const disabledValue = ref<CollapseModelValue>(['1'])
const programmaticValue = ref<CollapseModelValue>(['p1'])
const nestValue = ref<CollapseModelValue>(['n1'])
const nestInner1 = ref<CollapseModelValue>(['n1-1'])
const nestInner2 = ref<CollapseModelValue>(['n2-1'])

const sizes: ComponentSize[] = ['small', 'default', 'large']

const collapseRef = ref<CollapseExposed>()
const lastChange = shallowRef<CollapseModelValue>()
const onChange = (value: CollapseModelValue) => {
  lastChange.value = value
}
</script>

<style lang="scss" scoped>
.collapse-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .desc {
    margin: 0 0 12px;
    color: var(--u-text-color-placeholder);
    font-size: 13px;
    line-height: 1.6;

    code {
      padding: 1px 6px;
      border-radius: 4px;
      background: var(--u-bg-color-hover);
      color: var(--u-color-primary);
      font-size: 12px;
    }
  }

  .title-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .size-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .size-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .size-tag {
    display: inline-flex;
    align-self: flex-start;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--u-bg-color-hover);
    color: var(--u-text-color-second);
    font-size: 12px;
    text-transform: capitalize;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  p {
    margin: 0;
    line-height: 1.7;

    code {
      padding: 1px 6px;
      border-radius: 4px;
      background: var(--u-bg-color-hover);
      color: var(--u-text-color-title);
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 12px;
    }
  }
}
</style>
