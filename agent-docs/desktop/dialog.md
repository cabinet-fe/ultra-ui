---
title: UDialog 对话框
description: '从 @veltra/desktop 导入的模态对话框组件：v-model 或 trigger 插槽控制显隐，带遮罩、标题栏拖拽与最大化/还原。模态时默认按 Esc 关闭（closeOnEsc）、锁定 body 滚动（lockScroll）并把焦点圈在弹框内、关闭后还原焦点；面板带 role="dialog"、模态时带 aria-modal。默认插槽内容已在自带滚动容器内，超过高度自动滚动；最大化时通过作用域参数把内容高度设为 100% 铺满，无需自写高度与滚动样式。'
aliases: [Dialog, Modal, 弹窗, 模态框, modal]
keywords:
  [
    modelValue,
    update:modelValue,
    closed,
    maximized,
    fade-scale,
    DialogExposed,
    header,
    footer,
    trigger,
    modal,
    closeOnEsc,
    lockScroll,
    ComponentSize,
    Esc 关闭,
    点击遮罩关闭,
    拖拽移动,
    最大化还原,
    自带滚动,
    内容滚动,
    表单弹窗,
    多层弹窗叠加,
    焦点圈,
    焦点恢复,
    滚动锁定,
    aria-modal,
    z-index
  ]
---

# UDialog 对话框

`@veltra/desktop` 导出的 `UDialog` 是模态对话框组件：用 `v-model`（`modelValue`）或 `#trigger` 插槽控制显隐，内容渲染在 `body` 下，带遮罩、标题栏拖拽、最大化/还原按钮与 `footer` 按钮区插槽。

模态弹框默认支持按 Esc 关闭（不依赖焦点位置）、锁定 `body` 滚动，并把焦点移入弹框、`Tab` 在弹框内循环，关闭后焦点回到打开前的位置；面板带 `role="dialog"`，模态时带 `aria-modal="true"`。非模态弹框（`modal: false`）不锁滚动、不做焦点圈，避免页面无法滚动或键盘无法离开弹框。

对话框**自带滚动容器**：`#default` 插槽内容放在内部 `UScroll` 中，弹框高度受 `max-height: 90vh` 限制（最大化时 100vh），内容超出高度时自动滚动。因此**不要**在内容里再写 `height` / `max-height` / `overflow: auto`，也不要自己包滚动容器——只设置内容本身需要的布局样式即可。最大化时用 `#default` 的作用域参数 `maximized` 把内容高度设为 `100%` 即可跟随铺满。详见「典型示例 · 最大化时内容铺满」。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UDialog } from '@veltra/desktop'

const visible = ref(false)
</script>

<template>
  <UButton @click="visible = true">打开</UButton>

  <UDialog v-model="visible" title="提示" style="width: 480px">
    <p>这是对话框内容</p>

    <template #footer="{ close }">
      <UButton text @click="close()">取消</UButton>
      <UButton type="primary" @click="close()">确认</UButton>
    </template>
  </UDialog>
</template>
```

## API 签名

```ts
/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

/** 对话框过渡动画名称 */
export type DialogTransition = 'fade-scale'

/** 对话框组件属性 */
export interface DialogProps {
  /** 显示或隐藏。默认 false（defineModel 声明的默认值） */
  modelValue?: boolean
  /** 弹框标题，header 的别名 */
  title?: string
  /** 弹框头部文字，优先于 title */
  header?: string
  /** 大小尺寸，只影响标题栏内边距与标题字号。默认 'default' */
  size?: ComponentSize
  /** 显示模态遮罩。默认 true */
  modal?: boolean
  /** 全屏。已声明但当前版本无对应行为 */
  fullscreen?: boolean
  /** 过渡动画。默认 'fade-scale'，当前仅此一个取值 */
  transition?: DialogTransition
  /** 是否允许按 Esc 关闭弹框。默认 true */
  closeOnEsc?: boolean
  /** 打开时是否锁定 body 滚动。默认 true，仅模态弹框生效 */
  lockScroll?: boolean
}

/** 对话框组件定义的事件 */
export interface DialogEmits {
  /** 更新对话框的显示 */
  (e: 'update:modelValue', visible: boolean): void
  /** 遮罩淡出动画完全结束后触发 */
  (e: 'closed'): void
}

/**
 * 组件 ref 上暴露的属性（DeconstructValue 解包后的形态，
 * 通过 const dialogRef = ref<InstanceType<typeof UDialog>>() 访问）
 */
export interface DialogExposed {
  /** 关闭对话框，等价于把 modelValue 置为 false。同步，无返回值 */
  close: () => void
}
```

## 参数说明

| 参数         | 类型                              | 默认           | 必填 | 约束                                                                                 |
| ------------ | --------------------------------- | -------------- | :--: | ------------------------------------------------------------------------------------ |
| `modelValue` | `boolean`                         | `false`        |  否  | 用 `v-model` 绑定；`false` 时整棵弹框 DOM 不渲染                                     |
| `title`      | `string`                          | —              |  否  | 标题文字；`header` 存在时被忽略                                                      |
| `header`     | `string`                          | —              |  否  | 标题文字，优先于 `title`；要自定义结构时改用 `#header` 插槽                          |
| `size`       | `'small' \| 'default' \| 'large'` | `'default'`    |  否  | 仅影响标题栏 `padding` 与标题字号，不改变弹框宽高                                    |
| `modal`      | `boolean`                         | `true`         |  否  | `true` 时显示遮罩且点遮罩关闭；`false` 时遮罩 `pointer-events: none`，点击外部不关闭 |
| `fullscreen` | `boolean`                         | —              |  否  | 已声明但当前版本未实现任何行为                                                       |
| `transition` | `'fade-scale'`                    | `'fade-scale'` |  否  | 当前仅接受 `'fade-scale'`                                                            |
| `closeOnEsc` | `boolean`                         | `true`         |  否  | 按 Esc 关闭（document 级监听，不要求焦点在弹框内）；为 `false` 时 Esc 不触发关闭      |
| `lockScroll` | `boolean`                         | `true`         |  否  | 打开时锁定 `body` 滚动并补偿滚动条宽度，关闭后恢复原内联样式；非模态弹框不生效        |

## 方法与事件

| 名称                | 类型                         | 触发时机                                                                       |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| `update:modelValue` | `(visible: boolean) => void` | 点遮罩、按 Esc、点关闭按钮或调用 `close()` 时发出，配合 `v-model` 同步外部状态 |
| `closed`            | `()`                         | 遮罩淡出过渡 `after-leave` 后触发一次，此时 DOM 已卸载，适合清理表单状态       |
| `close`（ref 方法） | `() => void`，同步，无返回值 | 主动关闭，内部把 `modelValue` 置 `false`                                       |

插槽作用域：

- `#default="{ maximized }"`：`maximized: boolean`，弹框是否处于最大化。用它控制内容在最大化/还原之间的布局；常规内容无需处理，弹框已自带滚动。
- `#footer="{ close }"`：`close: () => void`，等价于 ref 上的 `close()`。
- `#trigger`：无作用域；渲染在遮罩之外，点击触发元素切换显隐。
- `#header`：无作用域；替换标题文字区域，标题栏拖拽与右侧按钮保留。

`#default` 插槽内容渲染在组件内部的 `UScroll` 中：弹框高度上限为 `90vh`（最大化时 `100vh`），内容超出即自动出现滚动条，标题栏与 `footer` 始终吸顶/吸底。因此内容里禁止再写 `height`、`max-height`、`overflow` 或自建滚动容器。

## 无障碍与交互约定

- 面板带 `role="dialog"` 与 `tabindex="-1"`；`modal` 为 `true` 时输出 `aria-modal="true"`，为 `false` 时不输出该属性。
- 有 `title` / `header`（含 `#header` 插槽）时，标题元素带 id、面板用 `aria-labelledby` 关联；没有标题时可通过透传的 `aria-label` 补充可访问名称。
- 模态弹框打开后焦点移入面板（优先第一个可聚焦元素，没有则聚焦面板自身），`Tab` / `Shift+Tab` 在面板内循环，关闭后焦点回到打开前的元素；非模态弹框不抢焦点、不做焦点圈。
- Esc 监听挂在 `document` 上，不要求焦点位于遮罩层；多层弹框叠加时只关闭最上层。`closeOnEsc: false` 可禁用。
- 模态弹框打开时默认锁定 `body` 滚动（`overflow: hidden`，并按滚动条宽度补偿 `padding-right`），关闭或卸载后恢复原有内联样式；多个遮罩叠加时按引用计数恢复。非模态弹框不锁滚动。
- `class` / `style` / `role` / `aria-*` 等透传属性落在弹框面板上，可覆盖默认的无障碍属性。

## 典型示例

### 表单对话框：footer 校验通过后再关闭

```vue
<script setup lang="ts">
import { reactive, ref, useTemplateRef } from 'vue'
import { UButton, UDialog, UForm, UInput } from '@veltra/desktop'

const visible = ref(false)
const formRef = useTemplateRef('form')
const formData = reactive({ name: '' })

async function handleConfirm(close: () => void) {
  const valid = await formRef.value?.validate()
  if (valid) {
    console.log(formData.name) // => 输入的名称
    close()
  }
}
</script>

<template>
  <UButton @click="visible = true">新建</UButton>

  <UDialog v-model="visible" title="新建" style="width: 560px">
    <UForm ref="form" :model="formData">
      <UInput label="名称" field="name" :rules="{ required: true }" />
    </UForm>

    <template #footer="{ close }">
      <UButton text @click="close()">取消</UButton>
      <UButton type="primary" @click="handleConfirm(close)">确认</UButton>
    </template>
  </UDialog>
</template>
```

### trigger 插槽：免 v-model，监听 closed 清理

```vue
<script setup lang="ts">
import { UButton, UDialog } from '@veltra/desktop'

function onClosed() {
  // 遮罩淡出动画完全结束后触发，在这里做清理
  console.log('弹框已完全关闭')
}
</script>

<template>
  <UDialog title="消息" @closed="onClosed">
    <template #trigger>
      <UButton>打开对话框</UButton>
    </template>

    <p>点击触发元素打开，再点击打开一次则关闭</p>
  </UDialog>
</template>
```

### 内容超长自动滚动（无需自写高度与滚动样式）

弹框已把内容包在内部滚动容器中，高度上限 `90vh`。内容超出时自动滚动，标题栏与 footer 不动。只写内容需要的样式，**不要**再给内容加 `height` / `max-height` / `overflow: auto`。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UDialog } from '@veltra/desktop'

const visible = ref(false)
const rows = Array.from({ length: 60 }, (_, i) => `第 ${i + 1} 行内容`)
</script>

<template>
  <UButton @click="visible = true">查看长内容</UButton>

  <!-- 只设宽度；高度由弹框的 90vh 上限控制，超出自动滚动 -->
  <UDialog v-model="visible" title="条款" style="width: 560px">
    <p v-for="row in rows" :key="row">{{ row }}</p>

    <template #footer="{ close }">
      <UButton type="primary" @click="close()">知道了</UButton>
    </template>
  </UDialog>
</template>
```

### 最大化时内容铺满（用 maximized 作用域参数）

最大化后弹框过渡到 `100vw × 100vh`，此时把内容高度设为 `100%` 即可跟随铺满。用 `#default` 的作用域参数 `maximized` 控制即可，**不要**自己给弹框或内容写 `position: fixed` 全屏样式。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UDialog } from '@veltra/desktop'

const visible = ref(false)
</script>

<template>
  <UButton @click="visible = true">打开</UButton>

  <UDialog v-model="visible" title="详情" style="width: 640px">
    <template #default="{ maximized }">
      <!-- 最大化时内容高度 100% 铺满；还原时由弹框高度与滚动容器接管 -->
      <div :style="{ height: maximized ? '100%' : undefined }">
        <p v-if="maximized">已最大化，内容高度跟随铺满</p>
        <p v-else>正常尺寸，内容超出 90vh 时自动滚动</p>
      </div>
    </template>
  </UDialog>
</template>
```

非模态弹框把 `modal` 设为 `false`（无遮罩、点击外部不关闭），与最大化互不影响，`maximized` 作用域参数在两种模式下都可用。

## 注意事项

> [!WARNING]
>
> - 组件**自带滚动容器**：`#default` 内容渲染在内部 `UScroll` 里，高度上限 `90vh`（最大化 `100vh`），超出自动滚动。**禁止**在内容上再写 `height` / `max-height` / `overflow: auto`，也禁止自建滚动容器或全屏定位——这些会造成滚动嵌套与样式冗余。
> - 组件不会自带宽度：必须通过 `style` 或 `class` 设置宽度（如 `style="width: 480px"`）；高度不要手写，交给 `max-height` 限制与内部滚动。
> - 最大化时用 `#default` 的作用域参数 `maximized` 把内容高度设为 `100%` 铺满；不要用 `position: fixed` 或 `100vw/100vh` 自写全屏样式。
> - 显隐绑定名是 `modelValue`（`v-model`），不是 `open` 或 `visible`。
> - 初始即传 `modelValue: true` 时弹框直接渲染（初始挂载不播放进入动画）；后续通过 `v-model` 切换时仍走 `fade-scale` 过渡。
> - `fullscreen` prop 已声明但当前版本没有对应行为；全屏效果用标题栏最大化按钮，弹框会过渡到 `100vw × 100vh`。
> - `title` 与 `header` 都是标题文字且 `header` 优先；要自定义标题结构用 `#header` 插槽，而不是传对象。
> - 没有拦截关闭的钩子（没有 `before-close`）：点遮罩、按 Esc、点关闭按钮都会直接关闭；需要校验通过才能关闭的流程，把关闭逻辑放进 footer 自己的回调里控制 `v-model`。
> - Esc 关闭不依赖焦点位置（`document` 级监听）；`closeOnEsc: false` 可禁用，多层弹框叠加时只关闭最上层。
> - 每次关闭后弹框内容即卸载，重新打开会重新挂载；需要保留的表单数据必须放在弹框组件外部。
> - 多个弹框叠加时按打开顺序自动递增 `z-index`，后开的在上层；非模态弹框内按下鼠标会把自身提到最前。
> - 示例独立成页运行时必须先初始化主题：`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。
