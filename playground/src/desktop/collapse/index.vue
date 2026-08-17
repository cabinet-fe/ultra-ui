<template>
  <div class="collapse-demo">
    <CustomCard title="基本用法">
      <p class="desc">
        边框卡片风格，每项独立圆角边框；展开时 chevron 旋转 180°，可同时展开多个面板。
      </p>
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

    <CustomCard title="内容区">
      <p class="desc">展开后的内容区域继承卡片背景，与标题区通过间距区分层次。</p>
      <u-collapse v-model="contentBgValue">
        <u-collapse-item value="b1" title="表单全局">
          <p>列数、标签宽度等全局表单配置。</p>
        </u-collapse-item>
        <u-collapse-item value="b2" title="字段校验">
          <p>配置各字段的校验规则与错误提示文案。</p>
        </u-collapse-item>
        <u-collapse-item value="b3" title="高级选项">
          <p>联动规则、异步校验与自定义 render。</p>
        </u-collapse-item>
      </u-collapse>
    </CustomCard>

    <CustomCard title="自定义头部">
      <p class="desc">
        通过 <code>#header</code> 插槽完全接管头部内容，作用域参数 <code>isActive</code>
        指示展开状态；业务图标、徽标等均可自由组合。
      </p>
      <u-collapse v-model="titleIconValue">
        <u-collapse-item value="account">
          <template #header="{ isActive }">
            <span class="header-title">
              <UIcon><User /></UIcon>
              账户信息
            </span>
            <UIcon class="header-chevron" :class="{ 'is-active': isActive }">
              <ArrowDown />
            </UIcon>
          </template>
          <p>头像、昵称、绑定手机等基础资料。</p>
        </u-collapse-item>
        <u-collapse-item value="notify">
          <template #header="{ isActive }">
            <span class="header-title">
              <UIcon><Bell /></UIcon>
              通知偏好
            </span>
            <UIcon class="header-chevron" :class="{ 'is-active': isActive }">
              <ArrowDown />
            </UIcon>
          </template>
          <p>邮件、站内信与推送渠道的开关与频率。</p>
        </u-collapse-item>
        <u-collapse-item value="security">
          <template #header="{ isActive }">
            <span class="header-title">
              <UIcon><Setting /></UIcon>
              安全设置
            </span>
            <UIcon class="header-chevron" :class="{ 'is-active': isActive }">
              <ArrowDown />
            </UIcon>
          </template>
          <p>登录密码、二次验证与设备管理。</p>
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

    <CustomCard title="自定义展开图标">
      <p class="desc">通过 <code>:expand-icon</code> 传入图标组件，活动态会自动旋转 180°。</p>
      <u-collapse v-model="customIconValue" :expand-icon="Plus">
        <u-collapse-item value="c1" title="点击展开 / 收起">
          <p>展开图标使用 <code>Plus</code>，旋转后呈“×”视觉，无需额外动画代码。</p>
        </u-collapse-item>
        <u-collapse-item value="c2">
          <template #header="{ isActive }">
            <span class="header-title">或使用 #header 插槽完全接管</span>
            <UIcon
              :style="{
                color: isActive ? 'var(--u-color-primary)' : 'var(--u-text-color-placeholder)'
              }"
            >
              <ArrowDown v-if="isActive" />
              <ArrowRight v-else />
            </UIcon>
          </template>
          <p>#header 插槽可以根据 <code>isActive</code> 状态返回不同图标，完全接管头部显示。</p>
        </u-collapse-item>
      </u-collapse>
    </CustomCard>

    <CustomCard title="禁用状态">
      <u-collapse v-model="disabledValue">
        <u-collapse-item value="1" title="正常项">
          <p>该项可以正常展开 / 收起。</p>
        </u-collapse-item>
        <u-collapse-item value="2" title="禁用项" disabled>
          <p>禁用状态下点击与键盘均不会触发切换。</p>
        </u-collapse-item>
      </u-collapse>
    </CustomCard>

    <CustomCard title="默认展开控制（default-collapse-all）">
      <p class="desc">
        新属性 <code>default-collapse-all</code> 默认为
        <code>false</code>（即组件默认展开全部）。可显式配置为
        <code>true</code> 从而实现默认全部折叠。
      </p>
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px">
        <div>
          <div
            style="
              font-weight: 500;
              font-size: 13px;
              margin-bottom: 8px;
              color: var(--u-text-color-second);
            "
          >
            默认情况 (default-collapse-all="false" / 全部展开)
          </div>
          <u-collapse v-model="defaultExpandValue">
            <u-collapse-item value="x1" title="模块 A">
              <p>默认初始化为全部展开状态。</p>
            </u-collapse-item>
            <u-collapse-item value="x2" title="模块 B">
              <p>在外部未传初始值的情况下，组件将自动激活所有折叠项。</p>
            </u-collapse-item>
          </u-collapse>
        </div>
        <div>
          <div
            style="
              font-weight: 500;
              font-size: 13px;
              margin-bottom: 8px;
              color: var(--u-text-color-second);
            "
          >
            配置为 true (default-collapse-all="true" / 全部折叠)
          </div>
          <u-collapse v-model="defaultCollapseValue" default-collapse-all>
            <u-collapse-item value="y1" title="模块 A">
              <p>初始化为折叠（收起）状态。</p>
            </u-collapse-item>
            <u-collapse-item value="y2" title="模块 B">
              <p>只有用户手动点击才会展开对应的折叠项。</p>
            </u-collapse-item>
          </u-collapse>
        </div>
      </div>
    </CustomCard>

    <CustomCard title="独立使用（v-model）">
      <p class="desc">
        不包裹在 <code>UCollapse</code> 内时，可通过 <code>v-model</code>（boolean）单独控制展开 /
        收起；边框卡片样式与动画与组合用法一致。
      </p>
      <div class="actions">
        <u-button size="small" @click="standaloneExpanded = true">展开</u-button>
        <u-button size="small" @click="standaloneExpanded = false">收起</u-button>
      </div>
      <u-collapse-item v-model="standaloneExpanded" title="独立折叠项">
        <p>
          当前状态：{{ standaloneExpanded ? '已展开' : '已收起' }}。点击标题或使用上方按钮均可切换。
        </p>
      </u-collapse-item>
    </CustomCard>

    <CustomCard title="嵌套使用">
      <u-collapse v-model="nestValue">
        <u-collapse-item value="n1" title="@veltra/desktop">
          <u-collapse v-model="nestInner1">
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
          <u-collapse v-model="nestInner2">
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
import type { CollapseModelValue } from '@veltra/desktop'
import { ArrowDown, ArrowRight, Bell, Plus, Setting, User } from '@veltra/icons/normal'
import type { ComponentSize } from '@veltra/utils'
import { ref } from 'vue'

import CustomCard from '../card/custom-card.vue'

const basicValue = ref<CollapseModelValue>(['design'])
const accordionValue = ref<CollapseModelValue>('a')
const sizeValue = ref<CollapseModelValue>(['s1'])
const customIconValue = ref<CollapseModelValue>(['c1'])
const disabledValue = ref<CollapseModelValue>(['1'])
const nestValue = ref<CollapseModelValue>(['n1'])
const nestInner1 = ref<CollapseModelValue>(['n1-1'])
const nestInner2 = ref<CollapseModelValue>(['n2-1'])

const defaultExpandValue = ref<CollapseModelValue>()
const defaultCollapseValue = ref<CollapseModelValue>()
const contentBgValue = ref<CollapseModelValue>(['b1'])
const titleIconValue = ref<CollapseModelValue>(['account'])
const standaloneExpanded = ref(false)

const sizes: ComponentSize[] = ['small', 'default', 'large']
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

  .header-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  .header-chevron {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--u-text-color-assist);
    transition: transform 0.2s;

    &.is-active {
      transform: rotate(180deg);
    }
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
