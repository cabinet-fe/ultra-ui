# Collapse 组件样式与 API 优化设计规约 (v2 - 遵循设计系统与追加分离模式)

## 1. 目标描述

根据用户最新的反馈意见，对 `UCollapse` 组件的样式密度进行精细的二次微调，确保内容呼吸感及内边距（padding）在各种状态下表现出完美的视觉对称与一致性，杜绝局促感，完全遵循 Ultra UI 的机器/人共读式 [design.md](file:///Users/whj/codes/ultra-ui/skills/veltra-ui/design-system/design.md) 核心设计系统。此外，组件需要额外支持一种**分离模式 (Split Mode)**，使得每个 `UCollapseItem` 在视觉上形成独立的卡片分组，适用于更丰富的后台与数据面板布局。

---

## 2. 详细设计

### 2.1 样式密度微调与呼吸一致性（遵循设计系统）
我们将彻底淘汰硬编码的 SCSS map 数值，将组件的 padding 全面与设计系统中的核心 tokens（全局尺寸 `gap` 和圆角 `radius`）进行语义化绑定：
- 全局 `gap` 定义对照：`small: 6px`, `default: 8px`, `large: 12px`。
- 全局 `radius` 定义对照：`small: 4px`, `default: 6px`, `large: 8px`。

根据设计系统的视觉韵律，我们制订如下精准的 padding 计算规范：
- **水平内边距 (`padding-x`)**：设为 `gap + radius`，在大屏下保持适当的横向张力。
- **垂直内边距 (`padding-y`)**：
  - Header：`gap + 2px` (以确保标题折叠时有足够的触控高度，且呼吸感舒缓)。
  - Content：展开后，为了打破“内容文字直接撞在标题底部”的局促感（即用户指出的 **content padding 不一致**），为内容顶部补充一个柔和的 `padding-top: gap - 2px`，同时保持底部 `padding-bottom: gap + 2px`，以形成完全对称一致的环绕呼吸带。

#### 新旧 Padding 参数对比表：

| 尺寸 (Size) | 属性 | 原 (Old) | 方案 A (V1) | **遵循设计系统 v2（最新）** | 计算公式 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **small** | `padding-x`<br>Header `padding-y`<br>Content `padding-y` | `12px`<br>`10px`<br>`0 12px 10px` | `10px`<br>`6px`<br>`0 10px 6px` | **`10px`**<br>**`8px`**<br>**`4px 10px 8px`** | `gap_s + rad_s`<br>`gap_s + 2px`<br>`(gap_s - 2px) x (gap_s + 2px)` |
| **default** | `padding-x`<br>Header `padding-y`<br>Content `padding-y` | `16px`<br>`14px`<br>`0 16px 14px` | `12px`<br>`10px`<br>`0 12px 10px` | **`14px`**<br>**`10px`**<br>**`6px 14px 10px`** | `gap_d + rad_d`<br>`gap_d + 2px`<br>`(gap_d - 2px) x (gap_d + 2px)` |
| **large** | `padding-x`<br>Header `padding-y`<br>Content `padding-y` | `20px`<br>`18px`<br>`0 20px 18px` | `16px`<br>`14px`<br>`0 16px 14px` | **`20px`**<br>**`14px`**<br>**`10px 20px 14px`** | `gap_l + rad_l`<br>`gap_l + 2px`<br>`(gap_l - 2px) x (gap_l + 2px)` |

---

### 2.2 新增分离模式 (Split Mode)
分离模式允许每个折叠面板项呈独立的“卡片”表现形式，彼此之间具有呼吸间隔，完美契合复杂配置分组。

#### 1. API 接口定义 (`types/collapse.ts`)
在 `CollapseProps` 中新增可选的 `split` 属性：
```typescript
export interface CollapseProps extends ComponentProps {
  // ...
  /**
   * 是否开启分离模式（各折叠项作为独立卡片并具有间隔）
   * @default false
   */
  split?: boolean
}
```

#### 2. 组件渲染与类名绑定 (`collapse.vue`)
在 `collapse.vue` 中支持 `split` 属性，并将 `split` 类名自动绑定到容器上：
```typescript
const props = withDefaults(defineProps<CollapseProps>(), {
  accordion: false,
  bordered: true,
  split: false // 默认不开启分离模式
})

const classList = computed(() => [
  cls.b,
  cls.m(size.value),
  bem.is('bordered', props.bordered),
  bem.is('split', props.split) // 新增
])
```

#### 3. SCSS 样式编写规范 (`style.scss`)
利用纯后代选择器在 `style.scss` 中实现对分离卡片效果的秒级样式渲染，不需要对 `collapse-item.vue` 进行任何运行时逻辑入侵：
- 当处于 `split` 模式时，外层大容器不提供边框、投影和背景，各 `u-collapse__item` 独立形成卡片。
- 每个独立卡片卡片带有各自的圆角、背景色、边框及微弱的卡片投影，并配合 hover 过渡动效。
- 各 `u-collapse__item` 之间的垂直间距采用 `fn.use-var(gap, $size)`，实现间距随尺寸的优雅自适应缩放。

---

## 3. 验证计划

- **代码构建校验**：运行 `bun run build` 确保各 package 构建顺利且无 TS 错误。
- **类型系统校验**：运行 `bun run check-types` 确保无任何类型冲突。
- **UI 呈现校验**：在 Playground 中编写专门的“分离模式” Demo 卡片，通过浏览器验证：
  1. 三种尺寸（small, default, large）下全新且高呼吸感的 padding 比例对称。
  2. 分离模式下各 item 之间的间隔、Hover 态卡片边框高亮微交互过渡。
