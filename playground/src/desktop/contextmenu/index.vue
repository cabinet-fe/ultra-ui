<template>
  <div>
    <CustomCard title="组件用法">
      <p class="desc">在下方区域右键打开菜单，支持图标与异步回调（删除项会 loading 2 秒）。</p>
      <div class="context-area" @contextmenu.prevent="onComponentContextMenu">
        在此区域右键打开菜单
      </div>

      <u-contextmenu
        v-if="componentVisible"
        :mouse-position="componentPos"
        :menus="componentMenus"
        @destroy="componentVisible = false"
      />
    </CustomCard>

    <CustomCard title="函数式 API">
      <p class="desc">
        通过 <code>contextmenu.pop()</code> 在鼠标位置弹出菜单，点击外部或回调完成后自动销毁。
      </p>
      <div class="context-area" @contextmenu.prevent="onPopContextMenu">
        右键调用 contextmenu.pop()
      </div>
    </CustomCard>

    <CustomCard title="overflow 容器（Teleport 不被裁剪）">
      <p class="desc">
        外层容器设置了 <code>overflow: hidden</code> 且高度有限。菜单通过 Teleport 渲染到
        body，不会被裁剪。
      </p>
      <div class="overflow-box">
        <div
          class="context-area context-area--compact"
          @contextmenu.prevent="onOverflowContextMenu"
        >
          在裁剪容器内右键，菜单应完整显示
        </div>
      </div>

      <u-contextmenu
        v-if="overflowVisible"
        :mouse-position="overflowPos"
        :menus="overflowMenus"
        :width="200"
        @destroy="overflowVisible = false"
      />
    </CustomCard>

    <CustomCard title="混合图标">
      <p class="desc">
        同级菜单项中只要有一项带图标，该层会统一预留图标列；若全部无图标则不占空白。
      </p>
      <div class="context-area" @contextmenu.prevent="onMixedIconContextMenu">
        右键查看混合图标菜单
      </div>

      <u-contextmenu
        v-if="mixedIconVisible"
        :mouse-position="mixedIconPos"
        :menus="mixedIconMenus"
        @destroy="mixedIconVisible = false"
      />
    </CustomCard>

    <CustomCard title="多级子菜单">
      <p class="desc">支持无限层级嵌套，子菜单在右侧弹出，贴边时自动向左展开。</p>
      <div class="context-area" @contextmenu.prevent="onNestedContextMenu">右键查看多级子菜单</div>

      <u-contextmenu
        v-if="nestedVisible"
        :mouse-position="nestedPos"
        :menus="nestedMenus"
        :width="140"
        @destroy="nestedVisible = false"
      />
    </CustomCard>

    <CustomCard title="动态菜单">
      <u-checkbox v-model="canEdit">允许编辑（控制「编辑」项禁用状态）</u-checkbox>
      <div
        class="context-area"
        style="margin-top: 12px"
        @contextmenu.prevent="onDynamicContextMenu"
      >
        右键查看动态菜单
      </div>

      <u-contextmenu
        v-if="dynamicVisible"
        :mouse-position="dynamicPos"
        :menus="getDynamicMenus"
        size="large"
        :width="240"
        @destroy="dynamicVisible = false"
      />
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { contextmenu, message, type ContextmenuItem } from '@veltra/desktop'
import { Copy, Delete, Edit } from '@veltra/icons/normal'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const componentVisible = shallowRef(false)
const componentPos = shallowRef({ x: 0, y: 0 })

const overflowVisible = shallowRef(false)
const overflowPos = shallowRef({ x: 0, y: 0 })

const dynamicVisible = shallowRef(false)
const dynamicPos = shallowRef({ x: 0, y: 0 })
const mixedIconVisible = shallowRef(false)
const mixedIconPos = shallowRef({ x: 0, y: 0 })
const nestedVisible = shallowRef(false)
const nestedPos = shallowRef({ x: 0, y: 0 })
const canEdit = shallowRef(false)

const componentMenus: ContextmenuItem[] = [
  { label: '编辑', icon: Edit, callback: () => message({ message: '编辑', type: 'info' }) },
  { label: '复制', icon: Copy, callback: () => message({ message: '已复制', type: 'success' }) },
  {
    label: '删除',
    icon: Delete,
    callback: async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      message({ message: '删除完成', type: 'success' })
    }
  }
]

const overflowMenus: ContextmenuItem[] = [
  { label: '刷新', callback: () => message({ message: '已刷新' }) },
  { label: '导出', callback: () => message({ message: '导出中...', type: 'info' }) }
]

const mixedIconMenus: ContextmenuItem[] = [
  { label: '编辑', icon: Edit, callback: () => message({ message: '编辑', type: 'info' }) },
  { label: '复制', callback: () => message({ message: '已复制', type: 'success' }) },
  { label: '删除', icon: Delete, callback: () => message({ message: '已删除', type: 'warn' }) }
]

const nestedMenus: ContextmenuItem[] = [
  {
    label: '新建',
    icon: Edit,
    children: [
      { label: '文档', callback: () => message({ message: '新建文档' }) },
      { label: '表格', callback: () => message({ message: '新建表格' }) },
      {
        label: '更多',

        children: [
          { label: '幻灯片', callback: () => message({ message: '新建幻灯片' }) },
          {
            label: '高级',
            children: [
              { label: '宏', callback: () => message({ message: '新建宏' }) },
              { label: '插件', callback: () => message({ message: '新建插件' }) }
            ]
          }
        ]
      }
    ]
  },
  { label: '复制', icon: Copy, callback: () => message({ message: '已复制', type: 'success' }) },
  { label: '删除', icon: Delete, callback: () => message({ message: '已删除', type: 'warn' }) }
]

function getDynamicMenus(): ContextmenuItem[] {
  return [
    { label: '新增', callback: () => message({ message: '新增' }) },
    {
      label: '编辑',
      disabled: () => !canEdit.value,
      callback: () => message({ message: '编辑', type: 'info' })
    },
    { label: '删除', disabled: true }
  ]
}

function onComponentContextMenu(e: MouseEvent) {
  componentPos.value = { x: e.clientX, y: e.clientY }
  componentVisible.value = true
}

function onPopContextMenu(e: MouseEvent) {
  contextmenu.pop({
    mousePosition: { x: e.clientX, y: e.clientY },
    menus: [
      { label: '打开', callback: () => message({ message: '打开' }) },
      { label: '重命名', callback: () => message({ message: '重命名', type: 'info' }) },
      { label: '移除', callback: () => message({ message: '已移除', type: 'warn' }) }
    ]
  })
}

function onOverflowContextMenu(e: MouseEvent) {
  overflowPos.value = { x: e.clientX, y: e.clientY }
  overflowVisible.value = true
}

function onMixedIconContextMenu(e: MouseEvent) {
  mixedIconPos.value = { x: e.clientX, y: e.clientY }
  mixedIconVisible.value = true
}

function onNestedContextMenu(e: MouseEvent) {
  nestedPos.value = { x: e.clientX, y: e.clientY }
  nestedVisible.value = true
}

function onDynamicContextMenu(e: MouseEvent) {
  dynamicPos.value = { x: e.clientX, y: e.clientY }
  dynamicVisible.value = true
}
</script>

<style lang="scss" scoped>
.desc {
  margin: 0 0 12px;
  color: var(--u-text-color-secondary);
  font-size: 14px;
  line-height: 1.6;

  code {
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--u-fill-color-light);
    font-size: 13px;
  }
}

.context-area {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  border: 1px dashed var(--u-border-color);
  border-radius: var(--u-radius-default);
  background: var(--u-fill-color-lighter);
  color: var(--u-text-color-secondary);
  user-select: none;

  &--compact {
    height: 120px;
  }
}

.overflow-box {
  height: 140px;
  overflow: hidden;
  border: 1px solid var(--u-border-color);
  border-radius: var(--u-radius-default);
  padding: 8px;
}
</style>
