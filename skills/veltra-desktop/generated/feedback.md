# 反馈通知

## message (UMessage, message)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/message.ts
import type { DeconstructValue } from '@veltra/utils'
import type { DefineComponent, AppContext } from 'vue'

/** 消息类型 */
export type MessageType = 'success' | 'warn' | 'info' | 'error' | 'default'

/** 消息选项 */
export type MessageOptions = MessageProps & {
  /** 关闭回调 */
  onClose?: () => void
  /** 关闭结束后回调 */
  onClosed?: () => void
}

type MsgAliasConf = Omit<MessageOptions, 'type' | 'message'>

export interface MessageInstance {
  /** 消息唯一标识 */
  id: string
  /** 手动关闭消息 */
  close(): void
  /** 消息彻底销毁后的 Promise (包括动画结束) */
  onClosed: Promise<void>
}

export interface Message {
  /** 创建消息 */
  (options: MessageOptions | string): MessageInstance
  /** 关闭所有的消息 */
  closeAll(): void
  /** 成功消息 */
  success(message: string, config?: MsgAliasConf): MessageInstance
  /** 警告消息 */
  warn(message: string, config?: MsgAliasConf): MessageInstance
  /** 信息消息 */
  info(message: string, config?: MsgAliasConf): MessageInstance
  /** 错误消息 */
  error(message: string, config?: MsgAliasConf): MessageInstance
  /** 默认消息 */
  default(message: string, config?: MsgAliasConf): MessageInstance
  /** 设置全局渲染上下文 */
  _context: AppContext | null
}

/** 消息弹框组件组件属性 */
export interface MessageProps {
  /** 消息内容 */
  message?: string
  /** 渲染样式 */
  type?: MessageType
  /** 是否可以关闭 */
  closable?: boolean
  /**
   * 持续时间, 单位ms
   * @default 3000
   */
  duration?: number
  /** 渲染html */
  html?: boolean
  /** 图标 */
  icon?: DefineComponent
}

/** 消息弹框组件组件定义的事件 */
export interface MessageEmits {}

/** 消息弹框组件组件暴露的属性和方法(组件内部使用) */
export interface _MessageExposed {}

/** 消息弹框组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MessageExposed = DeconstructValue<_MessageExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/message/index.vue -->
<template>
  <div>
    <div class="config">
      <u-radio-group
        radioType="btn"
        :items="[
          { label: 'default', value: 'default' },
          { label: 'info', value: 'info' },
          { label: 'success', value: 'success' },
          { label: 'warn', value: 'warn' },
          { label: 'error', value: 'error' }
        ]"
        v-model="config.type"
      />
      <u-number-input v-model="config.duration" :step="1000" :min="0"></u-number-input>
      <div>
        <u-checkbox v-model="config.closable">closable</u-checkbox>
      </div>
      <div>
        <u-checkbox v-model="config.html">渲染html</u-checkbox>
      </div>
    </div>
    <div class="btn">
      <u-button @click="message.closeAll()">关闭全部</u-button>
      <u-button type="primary" @click="showMsg">showMessage</u-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from '@veltra/desktop'
import type { MessageType } from '@veltra/desktop'
import { reactive } from 'vue'

const config = reactive({
  type: 'default' as MessageType,
  duration: 3000,
  closable: false,
  html: false
})

const showMsg = () => {
  message({
    message: '测试消息测试消息abcdABCD阿萨就肯定会今安徽的撒娇<h1>22</h1>',
    ...config,
    onClose() {
      console.log('开始关闭')
    },
    onClosed() {
      console.log('关闭完毕')
    }
  })
}
</script>

<style lang="scss" scoped>
.config {
  display: flex;
  flex-direction: column;
}
.btn {
  display: flex;
  justify-content: flex-end;
}
</style>
```

## notification (UNotification)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/notification.ts
import type { ColorType, DeconstructValue } from '@veltra/utils'
import type { DefineComponent, RendererElement } from 'vue'

/** 通知组件组件属性 */
export interface NotificationProps {
  modelValue?: string
  title?: string
  message?: string
  type?: ColorType
  closable?: boolean
  duration?: number
  offset?: number
  onClose?: (vm: RendererElement) => void
  onClick?: (e: MouseEvent) => void
  id?: string
  icon?: DefineComponent
  zIndex?: number
  buttonText?: string
  width?: number
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

/** 通知组件组件定义的事件 */
export interface NotificationEmits {
  (e: 'update:modelValue', value: string): void
}

/** 通知组件组件暴露的属性和方法(组件内部使用) */
export interface _NotificationExposed {}

/** 通知组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type NotificationExposed = DeconstructValue<_NotificationExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/notification/index.vue -->
<template>
  <div>
    <div class="config">
      <u-input v-model="config.buttonText" prefix="buttonText:"></u-input>
      <u-radio-group
        radioType="btn"
        :items="[
          { label: 'primary', value: 'primary' },
          { label: 'info', value: 'info' },
          { label: 'success', value: 'success' },
          { label: 'warning', value: 'warning' },
          { label: 'danger', value: 'danger' }
        ]"
        v-model="config.type"
      />
      <u-radio-group
        radioType="btn"
        :items="[
          { label: 'bottom-right', value: 'bottom-right' },
          { label: 'bottom-left', value: 'bottom-left' },
          { label: 'top-right', value: 'top-right' },
          { label: 'top-left', value: 'top-left' }
        ]"
        v-model="config.position"
      />
      <u-number-input v-model="config.duration" :step="1000" :min="0"></u-number-input>
      <u-checkbox v-model="config.closable">closable</u-checkbox>
    </div>
    <div class="btn">
      <u-button type="primary" @click="showMsg">showNotification</u-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Notification } from '@veltra/desktop'
import { reactive, ref } from 'vue'

const config = reactive({
  type: 'primary' as any,
  duration: 0,
  closable: false,
  position: 'bottom-right',
  buttonText: ''
})

let count = ref(0)

const showMsg = () => {
  count.value++
  Notification({
    title: `${count.value}-Event has been created`,
    message:
      'Sunday, December 03, 2023 at 9:00 AMSunday, December 03, 2023 at 9:00 AMSunday, December 03, 2023 at 9:00 AMSunday, December 03, 2023 at 9:00 AM',
    type: config.type,
    duration: config.duration,
    closable: config.closable,
    onClose: (vm) => {},
    buttonText: config.buttonText,
    onClick: (vm) => {},
    position: config.position as any
  })
}
</script>

<style lang="scss" scoped>
.config {
  display: flex;
  flex-direction: column;
}
.btn {
  display: flex;
  justify-content: flex-end;
}
</style>
```

## dialog (UDialog)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/dialog.ts
import type { ComponentSize, DeconstructValue } from '@veltra/utils'

/** 对话框组件属性 */
export interface DialogProps {
  /** 显示或隐藏 */
  modelValue?: boolean
  /** 弹框标题，header的别名 */
  title?: string
  /** 弹框头部内容，别名是header */
  header?: string
  /** 大小尺寸 */
  size?: ComponentSize
  /** 显示模态层 */
  modal?: boolean
  /** 全屏 */
  fullscreen?: boolean
}

/** 对话框组件定义的事件 */
export interface DialogEmits {
  /** 更新对话框的显示 */
  (e: 'update:modelValue', visible: boolean): void
  /** 对话框完全关闭后触发的事件 */
  (e: 'closed'): void
}

/** 对话框组件暴露的属性和方法(组件内部使用) */
export interface _DialogExposed {
  /** 关闭对话框 */
  close: () => void
}

/** 对话框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DialogExposed = DeconstructValue<_DialogExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/dialog/index.vue -->
<template>
  <div>
    <div>
      <p>对话框是是常用的交互型组件。</p>

      <p>在过去对话框有一些痛点：</p>

      <p>
        1. 在刚进入页面时还没打开弹框数据也会先渲染，
        只能在组件外部用v-if配合使用，而且会有每一次打开都会重新渲染数据渲染的问题
      </p>

      <p>2. 美观度不好</p>
    </div>

    <div>
      <u-checkbox v-model="modal">模态</u-checkbox>
    </div>

    <u-button @click="visible = true">打开</u-button>

    <u-dialog
      v-model="visible"
      :modal="modal"
      :auto-scroll="false"
      style="width: 80%"
      title="对话框标题"
    >
      <div style="height: 100%">height: 100%, 在全屏时生效</div>

      <u-card v-for="i in 2" :key="i">
        <u-card-cover
          src="http://5b0988e595225.cdn.sohucs.com/images/20190625/2a57bb7082f84e33b53dd79b30b949df.jpeg"
        />
      </u-card>

      <template #footer>
        <u-button type="primary" text @click="visible = false">取消</u-button>
        <u-pop-confirm @confirm="visible = false" title="确认删除吗asds sad asd">
          <template #reference>
            <u-button type="primary">确认</u-button>
          </template>
        </u-pop-confirm>
      </template>
    </u-dialog>

    <u-button ref="buttonRef" @click="transition.toggle((a) => !a)"> 移动 </u-button>

    <u-button @click="visible2 = !visible2">弹出</u-button>

    <div
      style="width: 100px; height: 100px; background-color: #ccc"
      v-if="visible2"
      ref="boxRef"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { useTransition } from '@veltra/compositions'
import type { ButtonExposed } from '@veltra/desktop'
import { setStyles } from '@veltra/utils'
import { computed, nextTick, shallowRef, watch } from 'vue'

const visible = shallowRef(false)
const modal = shallowRef(true)

const buttonRef = shallowRef<ButtonExposed>()
const buttonDom = computed(() => {
  return buttonRef.value?.el
})

const transition = useTransition('style', {
  target: buttonDom,
  enterTo: {
    transform: 'translate(100px, 0)'
  },
  enterActive: {
    transition: 'transform 0.3s'
  },
  leaveActive: {
    transition: 'transform 0.3s'
  }
})

const visible2 = shallowRef(false)

const boxRef = shallowRef<HTMLDivElement>()

const transition2 = useTransition('css', {
  name: 'slide-down',
  target: boxRef
})

watch(visible2, (v) => {
  if (v) {
    nextTick(() => {
      setStyles(boxRef.value!, {
        marginTop: '100px'
      })

      transition2.enter()
    })
  } else {
    transition2.leave()
  }
})
</script>

<style lang="scss" scoped>
@use 'pkg:@veltra/styles/anime/slide.scss' as *;
.box {
  display: flex;
  flex-direction: column;
  max-height: 200px;
  overflow: auto;
  border: 1px solid #ccc;

  p {
    height: 32px;
    margin: 0;
  }
}

.section1 {
  background-color: #ccc;
  flex-shrink: 0;
}
.section2 {
  background-color: cadetblue;
  flex-grow: 1;
  overflow: auto;
}
.section3 {
  background-color: #ccc;
  flex-shrink: 0;
}
</style>
```

## drawer (UDrawer)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/drawer.ts
import type { DeconstructValue } from '@veltra/utils'

/** 抽屉方向 */
export type DrawerDirection = 'left' | 'right' | 'top' | 'bottom'

/** 抽屉模式 */
export type DrawerMode = 'edge' | 'inset'

/** 抽屉组件属性 */
export interface DrawerProps {
  /** 是否显示抽屉 */
  modelValue?: boolean
  /** 抽屉方向 */
  direction?: DrawerDirection

  /** 是否显示关闭按钮 */
  showClose?: boolean
  /** 抽屉标题 */
  title?: string
}

/** 抽屉组件定义的事件 */
export interface DrawerEmits {
  (e: 'update:modelValue', value: boolean): void
  /** 关闭时触发 */
  (e: 'close'): void
  /** 完全关闭后触发 */
  (e: 'closed'): void
}

/** 抽屉组件暴露的属性和方法(组件内部使用) */
export interface _DrawerExposed {}

/** 抽屉组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DrawerExposed = DeconstructValue<_DrawerExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/drawer/index.vue -->
<template>
  <div class="demo-drawer">
    <h2>抽屉组件 Drawer</h2>

    <div class="demo-section">
      <h3>基础用法</h3>
      <u-button @click="basicVisible = true" type="primary">打开抽屉</u-button>
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
      <u-button @click="leftVisible = true" type="primary">左侧抽屉</u-button>
      <u-button @click="rightVisible = true" type="primary">右侧抽屉</u-button>
      <u-button @click="topVisible = true" type="primary">顶部抽屉</u-button>
      <u-button @click="bottomVisible = true" type="primary">底部抽屉</u-button>

      <u-drawer v-model="leftVisible" direction="left" title="左侧抽屉" :size="300">
        <p>这是从左侧弹出的抽屉</p>
      </u-drawer>

      <u-drawer v-model="rightVisible" direction="right" title="右侧抽屉" :size="400">
        <p>这是从右侧弹出的抽屉</p>
      </u-drawer>

      <u-drawer v-model="topVisible" direction="top" title="顶部抽屉" :size="200">
        <p>这是从顶部弹出的抽屉</p>
      </u-drawer>

      <u-drawer v-model="bottomVisible" direction="bottom" title="底部抽屉" :size="250">
        <p>这是从底部弹出的抽屉</p>
      </u-drawer>
    </div>

    <div class="demo-section">
      <h3>自定义配置</h3>
      <u-button @click="customVisible = true" type="primary">自定义抽屉</u-button>

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
```

## pop-confirm (UPopConfirm)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/pop-confirm.ts
import type { DeconstructValue } from '@veltra/utils'
import type { Component } from 'vue'

import type { TipProps } from './tip'

/** 气泡确认框组件属性 */
export interface PopConfirmProps extends Pick<
  TipProps,
  'alignment' | 'direction' | 'trigger' | 'contentTag'
> {
  /**文字 */
  title?: string
  /**icon 图标*/
  icon?: Component
  /**icon 颜色 */
  iconColor?: string
  /**
   * 确认按钮文字
   */
  confirmText?: string
  /**
   * 取消按钮文字
   */
  cancelText?: string
}

/** 气泡确认框组件定义的事件 */
export interface PopConfirmEmits {
  /** 确认事件 */
  (event: 'confirm'): void
  /** 取消事件 */
  (event: 'cancel'): void
}

/** 气泡确认框组件暴露的属性和方法(组件内部使用) */
export interface _PopConfirmExposed {}

/** 气泡确认框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PopConfirmExposed = DeconstructValue<_PopConfirmExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/pop-confirm/index.vue -->
<template>
  <div>
    <CustomCard title="气泡">
      <div style="display: flex; align-items: center; justify-content: space-between">
        <u-pop-confirm
          title="Are you sure to delete this?"
          @confirm="confirmEvent"
          @cancel="cancelEvent"
          alignment="start"
        >
          <template #reference>
            <u-button>删除</u-button>
          </template>
        </u-pop-confirm>

        <u-pop-confirm
          title="Are you sure to delete this?"
          @confirm="confirmEvent"
          @cancel="cancelEvent"
          alignment="start"
        >
          <template #reference>
            <u-button>删除</u-button>
          </template>
        </u-pop-confirm>
      </div>
    </CustomCard>
    <CustomCard title="自定义文字、图标">
      <u-pop-confirm
        title="自定义文字、图标"
        @confirm="confirmEvent"
        @cancel="cancelEvent"
        confirm-text="继续"
        cancel-text="结束"
        :icon="Word"
      >
        <template #reference>
          <u-button>删除</u-button>
        </template>
      </u-pop-confirm>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import { Word } from '@veltra/icons/colorful'

import CustomCard from '../card/custom-card.vue'

const confirmEvent = () => {
  console.log('confirm')
}
const cancelEvent = () => {
  console.log('cancel')
}
</script>
```

## message-confirm (UMessageConfirm, MessageConfirm)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/message-confirm.ts
import type { ColorType, ComponentProps, DeconstructValue } from '@veltra/utils'

/** 消息确认框组件属性 */
export interface MessageConfirmProps extends ComponentProps {
  modelValue?: string
  title?: string
  message: string
  confirmButtonText?: string
  cancelButtonText?: string
  confirmButtonType?: ColorType
  onClose?: (action: 'cancel' | 'confirm') => void
}

/** 消息确认框组件定义的事件 */
export interface MessageConfirmEmits {
  (e: 'update:modelValue', value: string): void
}

/** 消息确认框组件暴露的属性和方法(组件内部使用) */
export interface _MessageConfirmExposed {}

/** 消息确认框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MessageConfirmExposed = DeconstructValue<_MessageConfirmExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/message-confirm/index.vue -->
<template>
  <div>
    <div class="config">
      <u-input v-model="config.title" prefix="title:"></u-input>
      <u-input v-model="config.message" prefix="message:"></u-input>
      <u-input v-model="config.confirmButtonText" prefix="confirmButtonText:"></u-input>
      <u-input v-model="config.cancelButtonText" prefix="cancelButtonText:"></u-input>
      <u-radio-group
        radioType="btn"
        :items="[
          { label: 'primary', value: 'primary' },
          { label: 'info', value: 'info' },
          { label: 'success', value: 'success' },
          { label: 'warning', value: 'warning' },
          { label: 'danger', value: 'danger' }
        ]"
        v-model="config.confirmButtonType"
      ></u-radio-group>
    </div>
    <div class="btn">
      <u-button type="primary" @click="showMsg">showMessage</u-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MessageConfirm } from '@veltra/desktop'
import { reactive } from 'vue'

const config = reactive({
  confirmButtonType: 'primary' as any,
  title: 'this is a title',
  message: 'this is a message',
  confirmButtonText: '确定',
  cancelButtonText: ''
})

const showMsg = () => {
  MessageConfirm({
    title: config.title,
    message: config.message,
    confirmButtonType: config.confirmButtonType,
    confirmButtonText: config.confirmButtonText,
    cancelButtonText: config.cancelButtonText,
    onClose: (action) => {
      console.log(action)
    }
  })
  // MessageConfirm.danger('hahha', (action) => {
  //   console.log(action)
  // })
}
</script>
```

## loading (ULoading, vLoading)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/loading.ts
import type { DeconstructValue } from '@veltra/utils'

export type LoadingType = 'classic' | 'line' | 'dot' | 'spinner'

/** loading组件属性 */
export interface LoadingProps {
  /** 加载类型 */
  type: LoadingType
}

/** loading组件定义的事件 */
export interface LoadingEmits {
  (e: 'update:modelValue', value: string): void
}

/** loading组件暴露的属性和方法(组件内部使用) */
export interface _LoadingExposed {}

/** loading组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type LoadingExposed = DeconstructValue<_LoadingExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/loading/index.vue -->
<template>
  <div>
    <CustomCard title="基础使用">
      <u-table :data="data" :columns="columns" v-loading:[type]="loading" />
    </CustomCard>

    <u-radio-group :items="items" v-model="type"></u-radio-group>
    <u-button @click="load">加载数据</u-button>
  </div>
</template>

<script lang="ts" setup>
import { defineTableColumns } from '@veltra/desktop'
import { shallowRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

let loading = shallowRef(false)
const items = [
  { label: 'classic', value: 'classic' },
  { label: 'dot', value: 'dot' },
  { label: 'spinner', value: 'spinner' },
  { label: 'line', value: 'line' }
]

const type = shallowRef('spinner')
const columns = defineTableColumns(
  [
    { name: '姓名', key: 'name', align: 'center', fixed: 'left' },
    { name: '年龄', key: 'age', fixed: 'left' },
    { name: '性别', key: 'sex', fixed: 'right' },
    {
      name: '地址',
      key: 'address',
      children: [
        { name: '省', key: 'province' },
        { name: '市', key: 'city' },
        { name: '区', key: 'area' },
        { name: '街道', key: 'street' },
        {
          name: '小区',
          key: 'community',
          fixed: 'right',
          children: [
            { name: 'a', key: 'a', fixed: 'right' },
            { name: 'b', key: 'b', fixed: 'right' }
          ]
        }
      ]
    }
  ],
  { minWidth: 180 }
)

const data = shallowRef<any>([])

const load = () => {
  loading.value = true
  let time = setTimeout(() => {
    clearTimeout(time)
    data.value = Array.from({ length: 10 }).map((_, index) => {
      return {
        sex: index % 2 === 0 ? '男' : '女',
        name: 'name1' + index,
        age: Math.random() * 100,
        province: '江苏省' + index,
        city: '苏州市' + index,
        area: '姑苏区' + index,
        street: '金昌街道' + index,
        community: '彩香花园' + index,
        b: 'aa'
      }
    })
    loading.value = false
  }, 4000)
}

load()
</script>
```

## progress (UProgress)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/progress.ts
import type { ColorType, DeconstructValue } from '@veltra/utils'

/** progress组件属性 */
export interface ProgressProps {
  /** 类型 */
  type: ColorType | ((percentage: number) => ColorType)
  /** 圆形进度条尺寸 */
  size?: number | string
  /** 进度百分比 */
  percentage?: number
  /** 是否圆形进度条 */
  circle?: boolean
}

/** progress组件定义的事件 */
export interface ProgressEmits {}

/** progress组件暴露的属性和方法(组件内部使用) */
export interface _ProgressExposed {}

/** progress组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ProgressExposed = DeconstructValue<_ProgressExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/progress/index.vue -->
<template>
  <div class="progressDemo">
    <CustomCard title="配置">
      <div>
        <span>进度： </span>
        <u-number-input
          v-model="config.percentage"
          :max="100"
          style="width: 100px"
          :min="0"
          :step="10"
        />
      </div>
      <div>
        <span>样式： </span>

        <u-radio-group :items="types" v-model="config.type"></u-radio-group>
      </div>

      <div>
        <span>环形进度条尺寸 </span>

        <u-number-input v-model="config.size" style="width: 100px" :min="0" :max="200" :step="10" />
      </div>
    </CustomCard>

    <CustomCard title="条形进度条">
      <u-progress v-bind="config" />
    </CustomCard>

    <CustomCard title="圆形进度条">
      <u-progress v-bind="config" circle />
    </CustomCard>

    <CustomCard title="动态状态">
      <u-progress :percentage="config.percentage" :type="getType">
        <template #default="{ percentage }">
          {{ percentage }}%
          <span v-if="percentage < 70"></span>
          <span v-else-if="percentage < 90">内存所剩不多 </span>
          <span v-else>
            内存严重不足 <u-icon><Warning /></u-icon>
          </span>
        </template>
      </u-progress>
      <u-progress
        :percentage="config.percentage"
        :size="config.size"
        circle
        :type="getType"
        v-slot="{ percentage, type }"
      >
        <div :style="`color: var(--color-${type})`">{{ percentage }}%</div>
      </u-progress>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import type { ColorType } from '@veltra/desktop'
import { Warning } from '@veltra/icons/normal'
import { shallowReactive } from 'vue'

import CustomCard from '../card/custom-card.vue'

const config = shallowReactive({
  percentage: 0,
  type: 'primary' as ColorType,
  size: 100
})

const types = ['primary', 'info', 'success', 'warning', 'danger'].map((t) => {
  return {
    label: t,
    value: t
  }
})

const getType = (percentage: number) => {
  if (percentage < 70) {
    return 'success'
  }
  if (percentage < 90) {
    return 'warning'
  }
  return 'danger'
}
</script>
```

## tip (UTip)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/tip.ts
import type { DeconstructValue } from '@veltra/utils'
import type { CSSProperties } from 'vue'

export type TipDirection = 'top' | 'bottom' | 'left' | 'right'

export type TipAlign = 'center' | 'start' | 'end'

/** tip提示组件组件属性 */
export interface TipProps {
  /** 控制显影 */
  visible?: boolean
  /**提示内容 */
  content?: string
  /** 自定义tip样式 */
  style?: CSSProperties | string
  /** 自定义tip的class */
  class?: string | string[] | Record<string, boolean>
  /** 触发方式 */
  trigger?: 'hover' | 'click'
  /**
   * 触发元素
   * - 通过指定`triggerDom`来更改弹框弹出位置
   */
  triggerDom?: HTMLElement
  /**
   * 方向
   * @default 'auto'
   */
  direction?: TipDirection

  /** 隐藏箭头 */
  hideArrow?: boolean

  /**
   * 对齐方式
   * @default 'center'
   */
  alignment?: TipAlign

  /**
   * tip内容标签
   */
  contentTag?: string

  /** 禁用tip */
  disabled?: boolean
}

/** tip提示组件组件定义的事件 */
export interface TipEmits {
  (e: 'update:visible', value: boolean): void
}

/** tip提示组件组件暴露的属性和方法(组件内部使用) */
export interface _TipExposed {}

/** tip提示组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TipExposed = DeconstructValue<_TipExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/tip/index.vue -->
<template>
  <div>
    <div>
      方向:
      <u-radio-group :items="directions" v-model="direction"> </u-radio-group>
    </div>
    <div>对齐: <u-radio-group :items="aligns" v-model="alignment"> </u-radio-group></div>
    <div>
      触发方式:
      <u-radio-group :items="triggers" v-model="trigger"> </u-radio-group>
    </div>
    <div>内容: <u-textarea v-model="content" /></div>
    <CustomCard title="基础用法">
      <div style="text-align: right">
        <u-tip
          :direction="direction"
          :alignment="alignment"
          :trigger="trigger"
          :content="content"
          style="max-width: 300px"
        >
          <u-button type="primary" text style="margin-right: 10px">触发</u-button>
        </u-tip>
      </div>
    </CustomCard>

    <CustomCard title="虚拟触发">
      <u-button @click="pop(dom2?.el)" ref="dom1"> 触发按钮1 </u-button>
      <u-button @click="pop(dom1?.el)" ref="dom2"> 触发按钮2 </u-button>

      <u-tip trigger="click" :trigger-dom="triggerDom" v-model:visible="visible">
        <template #content>两极反转</template>
      </u-tip>
    </CustomCard>
  </div>
</template>

<script setup lang="ts">
import type { TipAlign, TipDirection } from '@veltra/desktop'
import { shallowRef, useTemplateRef } from 'vue'

import CustomCard from '../card/custom-card.vue'

const directions = ['top', 'bottom', 'left', 'right'].map((d) => ({
  label: d,
  value: d
}))
const aligns = ['start', 'center', 'end'].map((d) => ({
  label: d,
  value: d
}))
const triggers = ['hover', 'click'].map((d) => ({
  label: d,
  value: d
}))

const content = shallowRef(
  '提示内容提示内容提示内容提示内容提示内容提示内容提示内容提示内容提示内容提示内容提示内容提示内容'
)
const direction = shallowRef<TipDirection>('top')
const alignment = shallowRef<TipAlign>('center')
const trigger = shallowRef<'hover' | 'click'>('hover')

const triggerDom = shallowRef()

const visible = shallowRef(false)
const dom1 = useTemplateRef('dom1')
const dom2 = useTemplateRef('dom2')

function pop(el?: HTMLElement) {
  visible.value = true
  triggerDom.value = el
}
</script>

<style lang="scss" scoped>
.color-red {
  color: red;
}

.flex-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.flex-column {
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: space-around;
}
.tip-box {
  h4 {
    text-align: center;
    padding-bottom: 20px;
  }
}
.tip-row {
  padding: 0 20px;
  .u-tip:nth-child(1) {
    margin-left: 50px;
  }
  .u-tip:nth-child(3) {
    margin-right: 50px;
  }
}
.tip-center {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tip-column {
  width: max-content;
  padding: 10px 0;
  .u-tip {
    margin: 20px 0;
  }
}
.pd20 {
  margin-bottom: 80px;
}

.anime-test {
  display: none;
  opacity: 0;
}
</style>
```

## empty (UEmpty)

### 类型定义

```typescript
// 来源: packages/desktop/src/types/empty.ts
import type { DeconstructValue } from '@veltra/utils'

/** 空内容组件属性 */
export interface EmptyProps {
  /** 图标大小, 默认48 */
  size?: number

  /** 空文本 */
  text?: string
}

/** 空内容组件定义的事件 */
export interface EmptyEmits {}

/** 空内容组件暴露的属性和方法(组件内部使用) */
export interface _EmptyExposed {}

/** 空内容组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type EmptyExposed = DeconstructValue<_EmptyExposed>
```

### 使用示例

```vue
<!-- 来源: playgrounds/desktop/src/empty/index.vue -->
<template>
  <div>
    <CustomCard title="使用">
      <u-empty />
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import CustomCard from '../card/custom-card.vue'
</script>
```
