---
title: 滚动工具
description: 查找滚动父级与控制滚动的工具集：getScrollParents / getNearestScrollParent 查找可滚动祖先，scrollIntoContainerView 替代原生 scrollIntoView，scrollElementIntoView / scrollViewportByStep / applyWheelHorizontalScroll 支撑水平溢出导航。
aliases: [getScrollParents, getNearestScrollParent, scrollIntoContainerView, scrollElementIntoView, scrollViewportByStep, applyWheelHorizontalScroll, 滚动父级]
keywords: [getScrollParents, getNearestScrollParent, scrollIntoContainerView, scrollElementIntoView, scrollViewportByStep, applyWheelHorizontalScroll, scrollTop, scrollLeft, scrollWidth, clientWidth, scrollIntoView, 滚动定位, 滚动监听, 横向滚动, 溢出导航, 平滑滚动, 选中项可见]
---

# 滚动工具

`@veltra/utils` 导出滚动工具：`getScrollParents` / `getNearestScrollParent` 查找可滚动祖先，`scrollIntoContainerView` 在指定容器内滚动定位（替代原生 `scrollIntoView`），`scrollElementIntoView` / `scrollViewportByStep` / `applyWheelHorizontalScroll` 服务水平溢出导航（标签栏、工具栏的翻页箭头与滚轮横滚）。

## 快速上手

下拉面板打开后把选中项滚到可视区域中央，只滚指定容器、不带动外部页面：

```ts
import { scrollIntoContainerView } from '@veltra/utils'

const panel = document.querySelector<HTMLElement>('.select-panel')!
const selected = panel.querySelector<HTMLElement>('.is-selected')!

// 第二参传 null 时自动用 getNearestScrollParent(selected) 找容器
scrollIntoContainerView(selected, panel, { block: 'center' })
```

## API 签名

### 查找滚动父级

```ts
/**
 * 收集所有可滚动祖先（含横向可滚动容器），顺序为从最近父级到根
 * 判定：scrollHeight > clientHeight || scrollWidth > clientWidth
 */
export function getScrollParents(el: HTMLElement): HTMLElement[]

/** 查找最近的可滚动祖先（scrollHeight > clientHeight || scrollWidth > clientWidth）；不存在时返回 null */
export function getNearestScrollParent(el: HTMLElement): HTMLElement | null
```

### 容器内滚动定位

```ts
type ScrollViewPosition = 'center' | 'start' | 'end' // 未导出，仅约束取值

/**
 * 把 el 滚入 container 视图，替代 el.scrollIntoView（原生方法在嵌套滚动结构下会带动外部元素一起滚动）
 * @param el 目标元素
 * @param container 滚动容器；传 null 时用 getNearestScrollParent(el)，仍找不到则直接返回
 * @param options.block 垂直对齐，默认 'center'
 * @param options.inline 水平对齐，默认 'center'
 */
export function scrollIntoContainerView(
  el: HTMLElement,
  container: HTMLElement | null,
  options?: { block?: ScrollViewPosition; inline?: ScrollViewPosition }
): void
```

### 水平溢出导航

```ts
/**
 * 目标元素水平滚入视口；左侧越界对齐左缘、右侧越界对齐右缘，均留 offset 边距
 * @param vp 水平滚动视口
 * @param el 目标元素
 * @param offset 边距，默认 8
 */
export function scrollElementIntoView(vp: HTMLElement, el: HTMLElement, offset = 8): void

/**
 * 箭头按钮步进滚动：scrollLeft 平滑移动 dir * clientWidth * 0.8
 * @param vp 视口，需具备 scrollLeft / scrollWidth / clientWidth 与 scrollTo({left, behavior})
 * @param dir 仅允许 1（向右）或 -1（向左）
 */
export function scrollViewportByStep(
  vp: HTMLElement,
  dir: 1 | -1
): void

/**
 * 鼠标纵向滚轮驱动水平滚动；触控板横滑不拦截
 * @param e wheel 事件对象
 * @param vp 视口元素
 * @param navActive 导航按钮是否可见（内容未溢出时传 false，不消费事件）
 */
export function applyWheelHorizontalScroll(e: WheelEvent, vp: HTMLElement, navActive: boolean): void
```

## 参数说明

### getScrollParents / getNearestScrollParent

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `el` | `HTMLElement` | — | 是 | 起点；从 `el.parentElement` 开始向上遍历，不含 `el` 自身 |

判定规则：祖先满足 `scrollHeight > clientHeight || scrollWidth > clientWidth` 即计入——按内容是否溢出判定，不读 CSS `overflow` 属性；`overflow: hidden` 且内容溢出的祖先同样计入（弹层需监听它的 `scroll`）。`getNearestScrollParent` 返回第一个命中项或 `null`；`getScrollParents` 返回全部命中项的数组。

### scrollIntoContainerView

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `el` | `HTMLElement` | — | 是 | 目标元素 |
| `container` | `HTMLElement \| null` | — | 是 | 传 `null` 时回退 `getNearestScrollParent(el)`；回退仍无容器则不滚动直接返回 |
| `options.block` | `'center' \| 'start' \| 'end'` | `'center'` | 否 | 垂直对齐；`start` 对齐容器顶、`end` 对齐容器底 |
| `options.inline` | `'center' \| 'start' \| 'end'` | `'center'` | 否 | 水平对齐，语义同 `block` |

边界：垂直与水平都已完全在视图内时不滚动；单轴已可见时只滚另一轴；只写 `container.scrollTop` / `scrollLeft`，不产生平滑动画；定位基于 `el.offsetTop` / `offsetLeft`，要求 `container` 是 `el` 的 `offsetParent`（或布局等价），否则滚动位置偏差。

### scrollElementIntoView

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `vp` | `HTMLElement` | — | 是 | 水平滚动视口 |
| `el` | `HTMLElement` | — | 是 | 目标元素 |
| `offset` | `number` | `8` | 否 | 越界对齐时预留的像素边距 |

边界：只处理水平方向；用 `getBoundingClientRect` 比较，目标已完全可见时不滚动；滚动为 `behavior: 'smooth'` 平滑滚动。

### scrollViewportByStep

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `vp` | `HTMLElement` | — | 是 | 需同时具备滚动几何与 `scrollTo({ left, behavior })`，原生元素满足 |
| `dir` | `1 \| -1` | — | 是 | 仅这两个值；`1` 向右、`-1` 向左，步长固定为 `clientWidth * 0.8` |

### applyWheelHorizontalScroll

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `e` | `WheelEvent` | — | 是 | `wheel` 事件监听的回调入参 |
| `vp` | `HTMLElement` | — | 是 | 滚动写入目标（`vp.scrollLeft += e.deltaY`） |
| `navActive` | `boolean` | — | 是 | 内容未溢出（导航按钮不可见）时传 `false`，函数直接返回不消费事件 |

副作用与守卫顺序：`navActive` 为 `false` 直接返回 → `|deltaX| > |deltaY|` 判定为触控板横滑，不拦截 → `deltaY === 0` 返回 → 其余情况 `e.preventDefault()` 后横滚。因调用 `preventDefault()`，事件监听必须传 `{ passive: false }`。

## 典型示例

### 弹层打开时监听所有滚动父级

```ts
import { getScrollParents } from '@veltra/utils'

const trigger = document.querySelector<HTMLElement>('.pop-trigger')!

function onReposition() {
  // 重算弹层位置
}

// 纵向与横向滚动父级都要监听，任一滚动时重定位
const parents = getScrollParents(trigger)
parents.forEach((el) => el.addEventListener('scroll', onReposition, { passive: true }))
```

### 键盘导航时保持选中项可见

```ts
import { scrollIntoContainerView } from '@veltra/utils'

const list = document.querySelector<HTMLElement>('.option-list')!
const active = list.querySelector<HTMLElement>('.is-active')!

// 已可见则不滚动；未可见时垂直居中、水平居中
scrollIntoContainerView(active, list, { block: 'center', inline: 'center' })
```

### 水平标签栏：箭头翻页、活动标签滚入与滚轮横滚

```ts
import { applyWheelHorizontalScroll, scrollElementIntoView, scrollViewportByStep } from '@veltra/utils'

const viewport = document.querySelector<HTMLElement>('.tabs-viewport')!
const activeTab = viewport.querySelector<HTMLElement>('.is-active')!
const overflowing = viewport.scrollWidth > viewport.clientWidth

// 左右箭头：每次平滑滚动视口宽度的 80%
document.querySelector<HTMLElement>('.arrow-prev')!.addEventListener('click', () => {
  scrollViewportByStep(viewport, -1)
})
document.querySelector<HTMLElement>('.arrow-next')!.addEventListener('click', () => {
  scrollViewportByStep(viewport, 1)
})

// 切换标签后让活动标签滚入视野，留 8px 边距
scrollElementIntoView(viewport, activeTab)

// 鼠标滚轮纵向滚动转为横滚；必须 passive: false 才能拦截默认行为
viewport.addEventListener(
  'wheel',
  (e) => {
    applyWheelHorizontalScroll(e, viewport, overflowing)
  },
  { passive: false }
)
```

## 注意事项

> [!WARNING]
> - 本库替代方案是 `scrollIntoContainerView`，不是原生 `el.scrollIntoView`；后者在某些嵌套滚动结构下会带动外部元素一起滚。
> - 滚动父级判定基于内容溢出（`scrollHeight` / `scrollWidth` 比较），不是读取 CSS `overflow` 属性；与「overflow 为 auto / scroll 才算」的直觉写法不同。
> - `scrollIntoContainerView` 是同步直接赋值 `scrollTop` / `scrollLeft`，无平滑动画；需要平滑动画用 `scrollElementIntoView` 或 `scrollViewportByStep`。
> - `applyWheelHorizontalScroll` 的监听必须写 `{ passive: false }`，否则 `preventDefault()` 无效并在控制台报 `Unable to preventDefault inside passive event listener`。
> - `scrollElementIntoView` / `scrollViewportByStep` / `applyWheelHorizontalScroll` 只处理水平方向；垂直场景用 `scrollIntoContainerView`。
> - 导航按钮显隐与可用状态计算 `computeOverflowNavState` 在 `agent-docs/utils/text-nav.md`。
