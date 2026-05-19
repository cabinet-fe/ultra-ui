# Hero 浮雕效果 & 全局 Border 重构设计

## 背景

当前所有表单组件使用 `box-shadow: inset 0 0 1px 1px` 模拟边框，hero 主题缺乏视觉冲击力。目标是：

1. 全局从 inset shadow 模拟边框切换为真实 `border`
2. hero 主题在真实 border 基础上增加浮雕（emboss）shadow 效果

## 核心变更

### 全局：inset shadow → 真实 border

所有主题统一使用 `border: 1px solid var(--u-border-color)` 替代 `box-shadow: inset` 模拟边框。

| 主题                  | 边框                                      | 阴影                                         |
| --------------------- | ----------------------------------------- | -------------------------------------------- |
| light / shadcn / dark | `border: 1px solid var(--u-border-color)` | `box-shadow: none`（无浮雕）                 |
| hero                  | `border: 1px solid var(--u-border-color)` | `box-shadow: var(--u-shadow-emboss)`（浮雕） |

### 各状态行为

| 状态     | 以前                                                   | 以后（所有主题）                                                              |
| -------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| default  | `box-shadow: inset 0 0 1px 1px var(--u-border-color)`  | `border: 1px solid var(--u-border-color); box-shadow: var(--u-shadow-emboss)` |
| hover    | `box-shadow: inset 0 0 0px 1px var(--u-color-primary)` | `border-color: var(--u-color-primary)`                                        |
| focus    | `box-shadow: inset 0 0 1px 1px var(--u-color-primary)` | `border-color: var(--u-color-primary)`                                        |
| disabled | `box-shadow: inset 0 0 1px 1px var(--u-border-color)`  | `border-color: var(--u-border-color); box-shadow: none; opacity降低/背景灰`   |

### 不改动

- `form-component-height` 保持不变（24/32/40），接受 border 占用的 2px
- `collapse` 的 `inset 0 0 0 2px` 是激活态高亮，非边框模拟，暂不改
- `table` 的 inset shadow 用于固定列边缘渐隐，不改动
- `theme` 组件中 `inset 0 0 0 1px rgba(30,136,229,0.18)` 是装饰性，暂不改

## 主题 token 变更

### `Theme` 类型新增字段

```ts
shadow: {
  // ... 现有字段 color, x, y, blur, spread
  /** 浮雕阴影，非浮雕主题为 'none' */
  emboss: string
}
```

### 各主题 emboss 值

| 主题     | light    | shadcn   | hero (light)                                               | hero (dark)                                               | dark     |
| -------- | -------- | -------- | ---------------------------------------------------------- | --------------------------------------------------------- | -------- |
| `emboss` | `'none'` | `'none'` | `'0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)'` | `'0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.15)'` | `'none'` |

### UITheme 渲染

新增 `--u-shadow-emboss` CSS 变量，值为主题中 `emboss` 字符串直接输出。

## 受影响组件 SCSS

### 表单组件（核心改造：7 个 + form-item）

| 组件              | 文件                           | 改造要点                                                                                        |
| ----------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| input             | `input/style.scss`             | default: `border` + `shadow-emboss`; hover/focus: `border-color` 改变; disabled: `shadow: none` |
| textarea          | `textarea/style.scss`          | 同上                                                                                            |
| multi-select      | `multi-select/style.scss`      | 同上                                                                                            |
| multi-tree-select | `multi-tree-select/style.scss` | 同上                                                                                            |
| date-range-picker | `date-range-picker/style.scss` | 同上                                                                                            |
| cascade           | `cascade/style.scss`           | 同上                                                                                            |
| auto-complete     | `auto-complete/style.scss`     | 同上（仅 `.is-multiple` 修饰符）                                                                |
| code-editor       | `code-editor/style.scss`       | 组件级变量 `--u-code-editor-border` 相关改造                                                    |
| form-item         | `form-item/style.scss`         | error 状态的 inset shadow → `border-color: var(--u-color-danger)`                               |

### Button 组件

- 默认按钮增加 `box-shadow: var(--u-shadow-emboss)`
- plain 变体现有 `box-shadow: 0px 0px 2px 1px` → 替换为真实 border + emboss shadow
- text 变体保持无 shadow

### Card / Dropdown / Dialog 等弹出层

当前已使用 `fn.use-var(shadow)` 或自定义阴影，hero 主题的 shadow token 已具有较强的浮起感。可选择为其额外增加 emboss shadow 以增强浮浮雕感，但第一阶段聚焦表单组件，弹出层暂不改。

## 修复已知问题

- `input/style.scss` L20 和 `date-range-picker/style.scss` L30 的 `0px` 应改为 `0`（但这两个状态在改造后会被 `border-color` 替换，问题自然消失）

## 实施顺序

1. `Theme` 类型 + UITheme 渲染逻辑：新增 `shadow.emboss` 字段
2. 各主题文件：light/shadcn/dark 设 `emboss: 'none'`，hero 设浮雕阴影值
3. 表单组件 SCSS：逐个从 inset shadow → border + emboss shadow
4. Button SCSS：增加 emboss shadow
5. Code-editor：调整组件级变量
6. form-item error 状态改造
7. 视觉验证 & type check
