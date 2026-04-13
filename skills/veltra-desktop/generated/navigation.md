# 导航

## menu (UMenu, UMenuSub, UMenuItem)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/menu.ts
import type { DeconstructValue } from '@veltra/utils'
import type { DefineComponent } from 'vue'

/** 菜单项 */
export interface MenuItem {
  /** 图标 */
  icon?: string | DefineComponent
  /** 菜单标题 */
  title: string
  /** 菜单路径 */
  path: string
  /** 是否禁用 */
  disabled?: boolean
  /** 子菜单 */
  children?: MenuItem[]

  [key: string]: any
}

/** 菜单组件组件属性 */
export interface MenuProps {
  /** 当前路径 */
  currentPath?: string
  /** 是否折叠 */
  collapsed?: boolean
  /** 仅允许一个菜单可以打开 */
  uniqueOpened?: boolean
  /** 菜单列表 */
  menus?: MenuItem[]
}

/** 菜单组件组件定义的事件 */
export interface MenuEmits {
  (e: 'item-click', item: MenuItem): void
}

/** 菜单组件组件暴露的属性和方法(组件内部使用) */
export interface _MenuExposed {}

/** 菜单组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MenuExposed = DeconstructValue<_MenuExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/menu/index.vue -->
<template>
  <div class="cc">
    <div class="config">
      <div>
        {{ currentPath }}
      </div>
      <u-checkbox v-model="config.collapsed">折叠</u-checkbox>
    </div>

    <u-menu
      :menus="menus"
      :collapsed="config.collapsed"
      :current-path="currentPath"
      :style="{ width: config.collapsed ? '64px' : '260px' }"
      @item-click="router.replace({ path: route.path, query: { currentPath: $event.path } })"
      class="menu-wrapper"
    >
    </u-menu>
  </div>
</template>

<script setup lang="ts">
import { Cart, HouseFilled, Lock, UserGroup } from '@veltra/icons/normal'
import { shallowRef, ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const menus = shallowRef<any[]>([
  { title: '首页', icon: HouseFilled, path: '/' },
  { title: '功能模块管理', icon: UserGroup, path: '/business-center/modules' },

  { title: '数据字典', icon: Cart, path: '/business-center/dict' },
  { title: '用户管理', icon: Cart, path: '/business-center/user' },
  { title: '单位管理', icon: Cart, path: '/business-center/unit' },
  { title: '部门管理', icon: Cart, path: '/business-center/dept' },
  { title: '编码规则', icon: Lock, path: '/business-center/code-rule' },
  {
    title: '角色管理',
    icon: Cart,
    path: '/business-center/role',
    children: [
      {
        title: '功能模块管理',
        path: '/business-center/role/1'
      },
      { title: '角色管理', icon: Cart, path: '/business-center/role/2' },
      { title: '数据字典', icon: Cart, path: '/business-center/role/3' },
      {
        title: '用户管理',
        icon: Cart,
        path: '/business-center/role/4',
        children: [
          {
            title: '功能模块管理',
            icon: UserGroup,
            path: '/business-center/role/4/1',
            children: [
              {
                title: '角色管理',
                icon: Lock,
                path: '/business-center/role/4/4/1'
              },
              {
                title: '数据字典',
                icon: Cart,
                path: '/business-center/role/4/4/2'
              },
              {
                title: '用户管理',
                icon: Cart,
                path: '/business-center/role/4/4/3'
              },
              {
                title: '单位管理',
                icon: Cart,
                path: '/business-center/role/4/4/4'
              },
              {
                title: '部门管理',
                icon: Cart,
                path: '/business-center/role/4/4/5'
              },
              {
                title: '编码规则',
                icon: Lock,
                path: '/business-center/role/4/4/6'
              }
            ]
          },
          { title: '角色管理', icon: Lock, path: '/business-center/role/4/2' },
          { title: '数据字典', icon: Cart, path: '/business-center/role/4/3' },
          { title: '用户管理', icon: Cart, path: '/business-center/role/4/4' },
          { title: '单位管理', icon: Cart, path: '/business-center/role/4/5' },
          { title: '部门管理', icon: Cart, path: '/business-center/role/4/6' },
          { title: '编码规则', icon: Lock, path: '/business-center/role/4/7' }
        ]
      },
      { title: '单位管理', icon: Cart, path: '/business-center/role/5' },
      { title: '部门管理', icon: Cart, path: '/business-center/role/6' },
      { title: '编码规则', icon: Lock, path: '/business-center/role/7' }
    ]
  }
])

const route = useRoute()
const router = useRouter()

const currentPath = computed(() => {
  return route.query.currentPath as string
})

const config = reactive({
  collapsed: false
})

const menus1 = ref([
  {
    id: '1',
    title: '首页',
    icon: '🏠',
    expanded: false
  },
  {
    id: '2',
    title: '产品管理',
    icon: '📦',
    expanded: false,
    children: [
      {
        id: '2-1',
        title: '产品列表',
        icon: '📝'
      },
      {
        id: '2-2',
        title: '分类管理',
        icon: '🏷️',
        children: [
          {
            id: '2-2-1',
            title: '主分类',
            icon: '📁'
          },
          {
            id: '2-2-2',
            title: '子分类',
            icon: '📂',
            children: [
              {
                id: '2-2-2-1',
                title: '电子产品',
                icon: '💻'
              },
              {
                id: '2-2-2-2',
                title: '服装鞋帽',
                icon: '👕'
              }
            ]
          }
        ]
      },
      {
        id: '2-3',
        title: '库存管理',
        icon: '📊'
      }
    ]
  },
  {
    id: '3',
    title: '用户管理',
    icon: '👥',
    expanded: false,
    children: [
      {
        id: '3-1',
        title: '用户列表',
        icon: '👤'
      },
      {
        id: '3-2',
        title: '权限管理',
        icon: '🔐',
        badge: 'New'
      }
    ]
  },
  {
    id: '4',
    title: '系统设置',
    icon: '⚙️',
    expanded: false,
    children: [
      {
        id: '4-1',
        title: '基础设置',
        icon: '🔧'
      },
      {
        id: '4-2',
        title: '高级设置',
        icon: '🛠️',
        children: [
          {
            id: '4-2-1',
            title: '安全设置',
            icon: '🔒'
          },
          {
            id: '4-2-2',
            title: '性能优化',
            icon: '⚡'
          }
        ]
      }
    ]
  },
  {
    id: '5',
    title: '帮助中心',
    icon: '❓'
  }
])
</script>

<style scoped lang="scss">
@use 'pkg:@veltra/styles/functions' as fn;

.config {
  display: flex;
  flex-direction: column;
}

.cc {
  padding: 12px;
  background: url(http://5b0988e595225.cdn.sohucs.com/images/20190625/2a57bb7082f84e33b53dd79b30b949df.jpeg)
    no-repeat center center / cover;
  color: #fff;
}

.menu-wrapper {
  transition: width 0.25s;
  height: 600px;
  border-radius: 1rem;
  box-shadow: fn.use-var(shadow);
}
</style>
```

## breadcrumb (UBreadcrumb)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/breadcrumb.ts
import type { ComponentSize, DeconstructValue } from '@veltra/utils'

/** 面包屑单项 */
export interface BreadcrumbItem {
  /** 展示文案 */
  title: string
  /** 存在时渲染为 `<a>`，由浏览器处理导航 */
  href?: string
  /** 为 true 时不跳转、不触发 click */
  disabled?: boolean
}

/** 面包屑组件属性 */
export interface BreadcrumbProps {
  /** 路径项，顺序为从一级到末级 */
  items: BreadcrumbItem[]
  /** 尺寸 */
  size?: ComponentSize
  /**
   * 末级是否作为链接渲染
   * @default false — 末级为当前页，使用 `aria-current="page"`
   */
  lastLinked?: boolean
}

/** `item` 插槽作用域 */
export interface BreadcrumbSlotScope {
  item: BreadcrumbItem
  index: number
  isLast: boolean
}

/** 面包屑组件事件 */
export interface BreadcrumbEmits {
  /**
   * 可交互项（无 `href` 的链式项）被点击时触发；有 `href` 时不触发（走原生导航）
   */
  (e: 'click', item: BreadcrumbItem, index: number, ev: Event): void
}

/** @internal */
export interface _BreadcrumbExposed {}

export type BreadcrumbExposed = DeconstructValue<_BreadcrumbExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/breadcrumb/index.vue -->
<template>
  <div>
    <CustomCard title="基础">
      <u-breadcrumb :items="basicItems" @click="onClick" />
      <p v-if="msg" :style="{ marginTop: '12px', fontSize: '13px' }">{{ msg }}</p>
    </CustomCard>

    <CustomCard title="自定义分隔符">
      <u-breadcrumb :items="basicItems">
        <template #separator>
          <u-icon :size="14"><ArrowRight /></u-icon>
        </template>
      </u-breadcrumb>
    </CustomCard>

    <CustomCard title="末级为链接（lastLinked + href）">
      <u-breadcrumb last-linked :items="linkedLastItems" />
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@veltra/desktop'
import { ArrowRight } from '@veltra/icons/normal'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const basicItems: BreadcrumbItem[] = [
  { title: '首页', href: '#/' },
  { title: '导航' },
  { title: '面包屑' }
]

const linkedLastItems: BreadcrumbItem[] = [
  { title: '文档', href: '#/layout/index' },
  { title: '组件', href: '#/button/index' },
  { title: '当前页', href: '#/breadcrumb/index' }
]

const msg = shallowRef('')

const onClick = (_item: BreadcrumbItem, index: number) => {
  msg.value = `点击了索引 ${index}（无 href 的项可走 SPA 路由）`
}
</script>
```

## tabs (UTabs)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/tabs.ts
import type { ComponentProps } from '@veltra/utils'

export type TabItem = {
  /**
   * 标题名称
   * @description 如果不穿则以key为名称
   */
  name?: string
  /**
   * 标签页唯一标识
   */
  key: string
  /** 是否禁用 */
  disabled?: boolean
}

/** 标签页组件组件属性 */
export interface TabsProps extends ComponentProps {
  modelValue?: string
  /** 标签项 */
  items: TabItem[]
  /** 显示位置 */
  position?: 'left' | 'right' | 'top' | 'bottom'
  /** 是否可以动态编辑 */
  editable?: boolean
  /**
   * 是否保活
   * @default false
   */
  keepAlive?: boolean
  /** 是否允许拖拽排序 */
  // sortable?: boolean
  // beforeLeave?: (
  //   prev: string | number,
  //   next: string | number
  // ) => void | boolean | Promise<void | boolean>
}

/** 标签页组件组件定义的事件 */
export interface TabsEmits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'update:items', items: TabItem[]): void
  (e: 'update:active', active: string | number): void
  (e: 'delete', item: TabItem, index: number): void
  (e: 'create'): void
  (e: 'click', item: TabItem, index: number): void
}

/** 标签页组件组件暴露的属性和方法(组件内部使用) */
export interface _TabsExposed {}

/** 标签页组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TabsExposed {
  delete(key: number | string): void
}
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/tabs/comp-a.vue -->
<script setup>
import { onMounted, ref } from 'vue'

const count = ref(0)

onMounted(() => {
  console.log(1)
})
</script>

<template>
  <p>Current component: A</p>
  <span>count: {{ count }}</span>
  <button @click="count++">+</button>
</template>
```

```vue
<!-- 来源: playgrounds/desktop/src/tabs/comp-b.vue -->
<script setup>
import { ref } from 'vue'
const msg = ref('')
</script>

<template>
  <p>Current component: B</p>
  <span>Message is: {{ msg }}</span>
  <input v-model="msg" />
</template>
```

```vue
<!-- 来源: playgrounds/desktop/src/tabs/index.vue -->
<template>
  <div class="wrapper">
    <div class="config">
      <ul>
        <li v-for="item in configList">
          <u-checkbox v-model="config[item.key]">{{ item.label }}：{{ item.key }}</u-checkbox>
        </li>
        <li>
          <div>方位：position</div>
          <u-radio-group
            radioType="btn"
            :items="[
              { label: '上', value: 'top' },
              { label: '下', value: 'bottom' },
              { label: '左', value: 'left' },
              { label: '右', value: 'right' }
            ]"
            v-model="config.position"
          />
        </li>
      </ul>
    </div>

    <CustomCard title="使用和插槽的类型提示">
      <div @click="console.log('wrap clicked')">
        <u-tabs
          v-model:items="items"
          v-model="active"
          :position="config.position"
          :editable="config.editable"
          :keep-alive="config.keepAlive"
          @create="items = [...items, { name: 'aaa', key: 'aaa' }]"
          :style="{ height: config.fixedHeight ? '300px' : '' }"
        >
          <!-- <template v-for="item in items" #[item.name]>{{ item }}</template> -->

          <template #a>
            <CompA />
            <div>22</div>
            <div>22</div>
            <div>22</div>
            <div>22</div>
            <div>22</div>
            <div>22</div>
            <div>22</div>
            <div>22</div>
            <div>22</div>
            <div>22</div>
            <div>22</div>
            <div>22</div>
            <div>22</div>
            <div>22</div>
          </template>

          <template #c>
            <CompB />
          </template>

          <template #name:a>666</template>
        </u-tabs>
      </div>
    </CustomCard>

    <CustomCard title="弹框中">
      <u-dialog>
        <u-tabs
          v-model:items="items"
          v-model="active"
          :position="config.position"
          :editable="config.editable"
          :keep-alive="config.keepAlive"
          :style="{ height: config.fixedHeight ? '300px' : '' }"
        ></u-tabs>

        <template #trigger>
          <u-button>打开</u-button>
        </template>
      </u-dialog>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'
import CompA from './comp-a.vue'
import CompB from './comp-b.vue'
// let items = ref(['TabOne', 'TabTwo', 'TabThree', 'TabFour'])

let items = shallowRef<Array<{ name: string; key: string; disabled?: boolean }>>([])

setTimeout(() => {
  items.value = [
    { key: 'a', name: '测试标题1' },
    { key: 'b', name: '测试标题22', disabled: true },
    { key: 'c', name: '测试标题333' },
    { key: 'dd', name: '测试标题4444' }
  ]
}, 1000)

const active = ref<string>('c')

const count = ref(0)

const configList = [
  { label: '可编辑', key: 'editable' },
  { label: '保活', key: 'keepAlive' },
  { label: '固定高度', key: 'fixedHeight' }
  // { label: '排序', key: 'sortable' }
]
const config = reactive({
  editable: false,
  sortable: false,
  keepAlive: false,
  position: 'top' as any,
  fixedHeight: false
})
</script>

<style lang="scss" scoped>
.wrapper {
  .config {
    border: 1px dashed #eee;
  }
  .display {
    width: 600px;
    height: 400px;
    border: 1px solid gold;
  }
  .title {
    font-size: 20px;
    font-weight: 700;
    text-align: center;
    line-height: 50px;
  }
}
</style>
```

## steps (USteps)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/steps.ts
import type { ColorType, ComponentSize, DeconstructValue } from '@veltra/utils'

/** 步骤组件组件属性 */
export interface StepsProps {
  /**
   * 当前步骤项，默认为步骤的索引
   */
  current?: string | number
  /**
   * 尺寸
   */
  size?: ComponentSize
  /**
   * 步骤项
   */
  items: Record<string, any>[]
  /** 步骤项标签键 */
  labelKey?: string
  /**
   * 当前步骤项键
   * @description
   * 如果指定，则current的值会作为items中的键值来获取当前步骤项
   */
  currentKey?: string
  /**
   * 方向
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical'

  /** 居中对齐 */
  alignCenter?: boolean

  /**
   * 当前步骤项颜色类型
   */
  currentStepType?: ColorType
  /**
   * 已完成项步骤颜色类型
   * @default 'success'
   */
  finishedStepType?: ColorType
}

/** 步骤项插槽作用域 */
export interface StepsSlotScope {
  item: Record<string, any>
  index: number
}

/** 步骤组件组件定义的事件 */
export interface StepsEmits {
  /**
   * 当前步骤项变更
   */
  (e: 'update:current', value?: string | number): void
  /**
   * 步骤项点击事件
   */
  (e: 'item-click', item: Record<string, any>, index: number): void
}

/** 步骤组件组件暴露的属性和方法(组件内部使用) */
export interface _StepsExposed {}

/** 步骤组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type StepsExposed = DeconstructValue<_StepsExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/steps/basic.vue -->
<template>
  <u-steps :items="items" :current="1" animation="pulse" size="small"> </u-steps>
</template>

<script setup lang="ts">
const items = [{ label: '步骤1' }, { label: '步骤2' }, { label: '步骤3' }]
</script>
```

```vue
<!-- 来源: playgrounds/desktop/src/steps/full.vue -->
<template>
  <div>
    <div style="display: flex; gap: 30px; align-items: center; margin-bottom: 20px">
      <div>
        方向:
        <u-radio-group v-model="config.direction" :items="directions"></u-radio-group>
      </div>

      <div v-if="config.direction === 'horizontal'">
        居中:
        <u-switch v-model="config.alignCenter"></u-switch>
      </div>

      <div>
        当前步骤项颜色类型:
        <u-select
          style="width: 200px"
          v-model="config.currentStepType"
          :options="colorTypes"
        ></u-select>
      </div>

      <div>
        已完成项步骤颜色类型:
        <u-select
          v-model="config.finishedStepType"
          style="width: 200px"
          :options="colorTypes"
        ></u-select>
      </div>
    </div>

    <u-steps :items :current v-bind="config">
      <template #tip="{ item }">
        <div>{{ item.label }}</div>
      </template>
    </u-steps>

    <u-button-group>
      <u-button @click="current--">上一步</u-button>
      <u-button @click="current++">下一步</u-button>
    </u-button-group>
  </div>
</template>

<script setup lang="ts">
import type { ColorType } from '@veltra/desktop'
import { shallowReactive, shallowRef } from 'vue'

const directions = [
  { label: '水平', value: 'horizontal' },
  { label: '垂直', value: 'vertical' }
]

const colorTypes = [
  { label: 'primary', value: 'primary' },
  { label: 'info', value: 'info' },
  { label: 'success', value: 'success' },
  { label: 'warning', value: 'warning' },
  { label: 'danger', value: 'danger' }
]

const items = Array.from({ length: 10 }, (_, index) => ({
  label: `步骤${index + 1}`
}))

const current = shallowRef(0)

const config = shallowReactive({
  direction: 'horizontal' as 'horizontal' | 'vertical',
  currentStepType: undefined as ColorType | undefined,
  finishedStepType: 'success' as ColorType,
  alignCenter: false
})
</script>
```

```vue
<!-- 来源: playgrounds/desktop/src/steps/index.vue -->
<template>
  <div>
    <CustomCard title="基础使用">
      <Basic />
    </CustomCard>
    <CustomCard title="插槽">
      <StepsSlot />
    </CustomCard>
    <CustomCard title="提示">
      <StepTip />
    </CustomCard>
    <CustomCard title="完整用法">
      <Full />
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import CustomCard from '../card/custom-card.vue'
import Basic from './basic.vue'
import Full from './full.vue'
import StepsSlot from './steps-slot.vue'
import StepTip from './steps-tip.vue'
</script>
```

```vue
<!-- 来源: playgrounds/desktop/src/steps/steps-slot.vue -->
<template>
  <u-steps :items :current="current">
    <template #icon="{ index }">
      <template v-if="index < current">
        <UIcon> <Lock /> </UIcon>
      </template>
    </template>

    <template #content="{ item }">
      <div>{{ item.label }}</div>
      <div>{{ item.description }}</div>
    </template>
  </u-steps>
</template>

<script setup lang="ts">
import { Lock } from '@veltra/icons/normal'
import { ref } from 'vue'

const current = ref(2)
const items = Array.from({ length: 5 }, (_, index) => ({
  label: `步骤${index + 1}`,
  description: `步骤${index + 1}的描述`
}))
</script>
```

```vue
<!-- 来源: playgrounds/desktop/src/steps/steps-tip.vue -->
<template>
  <div>鼠标浮动在图标上</div>
  <u-steps :items :current="current">
    <template #tip="{ item }">
      {{ item.tip }}
    </template>
  </u-steps>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const current = ref(2)
const items = Array.from({ length: 5 }, (_, index) => ({
  label: `步骤${index + 1}`,
  tip: `步骤${index + 1}的提示`
}))
</script>
```

## dropdown (UDropdown)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/dropdown.ts
import type { DeconstructValue } from '@veltra/utils'
import type { CSSProperties } from 'vue'

/** 下拉框组件属性 */
export interface DropdownProps {
  /**
   * 触发方式
   * @default 'hover'
   */
  trigger?: 'hover' | 'click' | 'custom'
  /**
   * 宽度
   * @default - 跟随触发宽度
   */
  width?: string
  /**
   * 最小宽度
   */
  minWidth?: string
  /**
   * 内容容器标签
   */
  contentTag?: string
  /** 内容容器类 */
  contentClass?: unknown
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 显示下拉框 */
  visible?: boolean
  /** 禁用 */
  disabled?: boolean
}

/** 下拉框组件定义的事件 */
export interface DropdownEmits {
  /** 下拉框显示或隐藏事件 */
  (e: 'update:visible', visible: boolean): void
  /** 键盘事件 */
  (e: 'keydown', event: KeyboardEvent): void
}

/** 下拉框组件暴露的属性和方法(组件内部使用) */
export interface _DropdownExposed {
  /**
   * 打开下拉擦菜单
   * @param config 配置
   */
  open: (config?: {
    /** 自定义触发元素 */
    trigger?: HTMLElement
  }) => void
  /** 关闭 */
  close: () => void
  /** 更新下拉框位置 */
  updateDropdown: () => void
}

/** 下拉框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DropdownExposed = DeconstructValue<_DropdownExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/dropdown/index.vue -->
<template>
  <div>
    <div style="height: 80vh">
      <u-radio-group :items="items" v-model="trigger" />

      <CustomCard title="虚拟触发">
        <div>
          <u-button
            @mouseenter="dropdownRef?.open({ trigger: spanRef })"
            @mouseleave="dropdownRef?.close()"
          >
            浮动触发离开关闭
          </u-button>
        </div>

        <br />

        <div>
          <u-button @click="handleClickTrigger" style="margin-right: 10px"> 点击触发 </u-button>
        </div>

        <br />

        <div>
          <span ref="spanRef">触发位置</span>
        </div>

        <u-dropdown class="bb" width="200px" ref="dropdownRef" :trigger="trigger">
          <template #content>
            <ul>
              <li>第一层hover第一层hover第一层hover第一层hover第一层hover</li>
              <li>第二层hover</li>
              <li>第三层hover</li>
              <li>第四层hover</li>
              <li>第五层hover</li>
              <li>第六层hover</li>
            </ul>
          </template>
        </u-dropdown>
      </CustomCard>
    </div>

    <div style="display: flex; justify-content: right">
      <u-dropdown :trigger="trigger" class="bb" width="200px">
        <template #trigger>
          <u-button>dropdown-hover</u-button>
        </template>

        <template #content>
          <ul>
            <li>第一层hover第一层hover第一层hover第一层hover第一层hover</li>
            <li>第二层hover</li>
            <li>第三层hover</li>
            <li>第四层hover</li>
            <li>第五层hover</li>
            <li>第六层hover</li>
          </ul>
        </template>
      </u-dropdown>
    </div>

    <div style="height: 80vh"></div>
  </div>
</template>

<script setup lang="ts">
import type { DropdownExposed } from '@veltra/desktop'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const items = [
  { label: '浮动', value: 'hover' },
  { label: '点击', value: 'click' }
]

const trigger = shallowRef<'hover' | 'click'>('hover')

const dropdownRef = shallowRef<DropdownExposed>()

const spanRef = shallowRef<HTMLSpanElement>()

function handleClickTrigger() {
  dropdownRef.value?.open({ trigger: spanRef.value })
}
</script>
```

## float-button (UFloatButton)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/float-button.ts
import type { ComponentProps, DeconstructValue } from '@veltra/utils'
import type { Component } from 'vue'

import type { ButtonType } from './button'

export interface FloatButtonItem {
  /** 一个图标 */
  icon?: Component
  /** 名称 */
  name?: string
  /** 按钮颜色类别 */
  type?: ButtonType
  /** 标识，用来确定唯一性 */
  key: string
}

/** 悬浮按钮组件属性 */
export interface FloatButtonProps extends ComponentProps {
  /** 操作项 */
  items?: FloatButtonItem[]
}

/** 悬浮按钮组件定义的事件 */
export interface FloatButtonEmits {
  (e: 'click', key: string): void
}

/** 悬浮按钮组件暴露的属性和方法(组件内部使用) */
export interface _FloatButtonExposed {}

/** 悬浮按钮组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type FloatButtonExposed = DeconstructValue<_FloatButtonExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/float-button/index.vue -->
<template>
  <div>
    右下角查看

    <u-float-button :items="items"> </u-float-button>
  </div>
</template>

<script lang="ts" setup>
import type { FloatButtonItem } from '@veltra/desktop'

const items: FloatButtonItem[] = [
  { key: 'a', name: '你' },
  { key: 'b', name: '好', type: 'danger' },
  { key: 'c', name: '世' },
  { key: 'd', name: '界' }
]
</script>
```

## context-menu (contextmenu)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/context-menu.ts
import type { ComponentProps, DeconstructValue } from '@veltra/utils'
import type { Component } from 'vue'

/**
 * 右键菜单项
 */
export interface ContextMenuItem {
  /** 菜单名称 */
  label: string
  /** 菜单描述 */
  description?: string
  /** 菜单图标 */
  icon?: Component
  /** 菜单点击时的回调 */
  callback?: () => void | Promise<void>
  /** 是否禁用 */
  disabled?: boolean | (() => boolean)
}

/** 鼠标右键菜单组件属性 */
export interface ContextMenuProps extends ComponentProps {
  /** 鼠标位置 */
  mousePosition: { x: number; y: number }
  /**
   * 菜单宽度
   * @default 200
   */
  width?: number | string
  /** 菜单项 */
  menus: ContextMenuItem[] | (() => ContextMenuItem[])
}

/** 鼠标右键菜单组件定义的事件 */
export interface ContextMenuEmits {
  (e: 'destroy'): void
}

/** 鼠标右键菜单组件暴露的属性和方法(组件内部使用) */
export interface _ContextMenuExposed {}

/** 鼠标右键菜单组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ContextMenuExposed = DeconstructValue<_ContextMenuExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/contextmenu/index.vue -->
<template>
  <div>在菜单栏上点击鼠标右键，查看效果</div>
</template>

<script lang="ts" setup></script>
```
