# Hero 浮雕效果 & 全局 Border 重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将所有表单组件从 `box-shadow: inset` 模拟边框切换为真实 `border`，并为 hero 主题增加浮雕（emboss）外投影效果。

**Architecture:** 在 Theme 类型中新增 `shadow.emboss` token（string 类型），非主题通过 `none` 值跳过浮雕，hero 主题注入多层阴影值。组件 SCSS 统一改用 `border` + `box-shadow: var(--u-shadow-emboss)` 替代 `inset shadow` 模式。

**Tech Stack:** TypeScript（UITheme 类型+渲染）、SCSS（组件样式）、Vue 3

---

## Task 1: Theme 类型 — 新增 `shadow.emboss` 字段

**Files:**

- Modify: `packages/styles/src/theme/type.ts:124-135`（shadow 对象）

- [ ] **Step 1: 在 Theme 类型中 shadow 下新增 `emboss` 字段**

在 `packages/styles/src/theme/type.ts` 的 `shadow` 对象中，在 `spread` 后新增：

```ts
shadow: {
  /** 阴影颜色 */
  color: string
  /** 阴影水平偏移 */
  x: number
  /** 阴影垂直偏移 */
  y: number
  /** 阴影模糊半径 */
  blur: number
  /** 阴影扩散半径 */
  spread: number
  /** 浮雕阴影：非浮雕主题为 'none'，浮雕主题为完整 box-shadow 值 */
  emboss: string
}
```

- [ ] **Step 2: 运行 type check 验证类型变更**

Run: `bun run check-types 2>&1 | head -30`

预期：大量主题文件报错（缺少 `emboss` 字段），这是正常的，后续 Task 会修复。

- [ ] **Step 3: Commit**

```bash
git add packages/styles/src/theme/type.ts
git commit -m "feat(theme): add shadow.emboss token to Theme type"
```

---

## Task 2: 各主题文件 — 填充 `emboss` 值

**Files:**

- Modify: `packages/styles/src/theme/light.ts:53`（lightTheme shadow）
- Modify: `packages/styles/src/theme/hero.ts:35`（heroLightTheme shadow）和 `hero.ts:63`（heroDarkTheme shadow）
- Modify: `packages/styles/src/theme/dark.ts:37`（darkTheme shadow）
- Modify: `packages/styles/src/theme/shadcn.ts:35`（shadcnLightTheme shadow）

- [ ] **Step 1: lightTheme — 添加 `emboss: 'none'`**

在 `packages/styles/src/theme/light.ts` 的 `shadow` 对象中，在 `spread: 1` 后加 `emboss: 'none'`：

```ts
shadow: { color: '#0000001a', x: 0, y: 0, blur: 4, spread: 1, emboss: 'none' },
```

- [ ] **Step 2: heroLightTheme — 添加 `emboss` 浮雕阴影值**

在 `packages/styles/src/theme/hero.ts` 的 `heroLightTheme.new(...)` 的 `shadow` 对象中加 `emboss`：

```ts
shadow: { color: 'rgba(0, 0, 0, 0.08)', x: 0, y: 4, blur: 14, spread: 0, emboss: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)' }
```

- [ ] **Step 3: heroDarkTheme — 添加暗色浮雕阴影值**

在 `heroDarkTheme.new(...)` 的 `shadow` 对象中加 `emboss`：

```ts
shadow: { color: 'rgba(0, 0, 0, 0.2)', x: 0, y: 4, blur: 14, spread: 0, emboss: '0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.15)' }
```

- [ ] **Step 4: darkTheme — 添加 `emboss: 'none'`**

darkTheme 通过 `lightTheme.new()` 创建，只覆盖了部分 shadow 字段。需要在 shadow 覆盖中加 `emboss: 'none'`：

```ts
shadow: { color: 'rgba(255, 255, 255, 0.2)', x: 0, y: 2, blur: 8, spread: 0, emboss: 'none' },
```

- [ ] **Step 5: shadcnLightTheme — 添加 `emboss: 'none'`**

```ts
shadow: { color: 'rgba(0, 0, 0, 0.05)', x: 0, y: 1, blur: 2, spread: 0, emboss: 'none' },
```

注：`shadcnDarkTheme` 和 `heroDarkTheme` 一样，继承自各自的 light 主题，如果它们不覆盖 shadow 中的 emboss，则继承 `'none'`。但 heroDarkTheme 需要覆盖为暗色浮雕值（Step 3 已处理）。shadcnDarkTheme 无需额外改动。

- [ ] **Step 6: 运行 type check 确认所有主题文件类型正确**

Run: `bun run check-types 2>&1 | head -30`

预期：无类型错误。

- [ ] **Step 7: Commit**

```bash
git add packages/styles/src/theme/light.ts packages/styles/src/theme/hero.ts packages/styles/src/theme/dark.ts packages/styles/src/theme/shadcn.ts
git commit -m "feat(theme): add emboss shadow values to all theme definitions"
```

---

## Task 3: UITheme 渲染 — 确保 `--u-shadow-emboss` 正确输出

**Files:**

- Verify: `packages/styles/src/theme/ui-theme.ts`（无需修改，`renderBase` 已能处理 string 类型 leaf）

- [ ] **Step 1: 验证 `renderBase` 对 `emboss` 字段的处理**

`withUnit` 函数的逻辑：如果值是 number 或数字字符串则加 `px`，否则原样返回字符串。`emboss` 值为：

- `'none'` → `withUnit('none', 'px')` → `'none'`（`isNaN(+'none')` 为 true）
- `'0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)'` → 原样返回

所以 `renderBase` 会自动为 `shadow.emboss` 生成 `--u-shadow-emboss: none;` 或 `--u-shadow-emboss: 0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06);`。**无需修改 `ui-theme.ts`。**

- [ ] **Step 2: 在 playground 中验证 CSS 变量输出**

启动 playground，在浏览器 DevTools 中检查 `<html>` 元素的 `--u-shadow-emboss` 变量值：

- 默认主题：`none`
- hero 主题：`0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)`

Run: `cd playgrounds/desktop && bun dev`，然后浏览器检查。

- [ ] **Step 3: 如果发现问题则修复，否则继续下一 Task**

---

## Task 4: Input — 从 inset shadow 改为 border + emboss

**Files:**

- Modify: `packages/desktop/src/components/input/style.scss`

- [ ] **Step 1: 修改 input 组件样式**

将整个 `@include m.b($root-name)` 块中的 inset shadow 替换为 border + emboss。

改前 key lines:

```scss
box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
transition: box-shadow 0.25s ease;

&:hover {
  box-shadow: inset 0 0 0px 1px fn.use-var(color, primary);
}

@include m.is(focus) {
  box-shadow: inset 0 0 1px 1px fn.use-var(color, primary);
}

@include m.is(disabled) {
  background-color: fn.use-var(color, disabled);
  box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
}
```

改后:

```scss
border: fn.use-var(border);
box-shadow: fn.use-var(shadow, emboss);
transition:
  border-color 0.25s ease,
  box-shadow 0.25s ease;

&:hover {
  border-color: fn.use-var(color, primary);
}

@include m.is(focus) {
  border-color: fn.use-var(color, primary);
}

@include m.is(disabled) {
  background-color: fn.use-var(color, disabled);
  box-shadow: none;
}
```

注意：保留 `overflow: hidden;`、`width: 100%;`、`vertical-align: middle;`、`line-height: 1;`、flex mixin 等不变。`@include m.size` 块不变。`.u-input__native` 中的 `border: none;` 不变（内层 input 不需要 border）。

- [ ] **Step 2: 在 playground 中视觉验证 input 组件**

Run: `cd playgrounds/desktop && bun dev`，检查：

- 默认主题：input 显示 1px 灰色边框，无浮雕阴影
- hover/focus：边框变 primary 色
- disabled：边框保持灰色，无阴影
- hero 主题：input 有 1px 边框 + 浮雕阴影，hover/focus 时边框变紫 + 浮雕阴影保留

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/input/style.scss
git commit -m "feat(input): replace inset shadow with real border + emboss shadow"
```

---

## Task 5: Textarea — 同上改造

**Files:**

- Modify: `packages/desktop/src/components/textarea/style.scss`

- [ ] **Step 1: 修改 textarea 组件样式**

改前 key lines:

```scss
box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
transition: box-shadow 0.25s ease;

&:hover {
  box-shadow: inset 0 0 1px 1px fn.use-var(color, primary);
}

@include m.is(focus) {
  box-shadow: inset 0 0 1px 1px fn.use-var(color, primary);
}

@include m.is(disabled) {
  background-color: fn.use-var(color, disabled);
  box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
}
```

改后:

```scss
border: fn.use-var(border);
box-shadow: fn.use-var(shadow, emboss);
transition:
  border-color 0.25s ease,
  box-shadow 0.25s ease;

&:hover {
  border-color: fn.use-var(color, primary);
}

@include m.is(focus) {
  border-color: fn.use-var(color, primary);
}

@include m.is(disabled) {
  background-color: fn.use-var(color, disabled);
  box-shadow: none;
}
```

- [ ] **Step 2: 视觉验证 textarea**

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/textarea/style.scss
git commit -m "feat(textarea): replace inset shadow with real border + emboss shadow"
```

---

## Task 6: Multi-Select — 同上改造

**Files:**

- Modify: `packages/desktop/src/components/multi-select/style.scss`

- [ ] **Step 1: 修改 multi-select 组件样式**

改前 key lines:

```scss
box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
transition: box-shadow 0.25s ease;

&:hover {
  box-shadow: inset 0 0 1px 1px fn.use-var(color, primary);
}

@include m.is(disabled) {
  background-color: fn.use-var(color, disabled);
  box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
}
```

改后:

```scss
border: fn.use-var(border);
box-shadow: fn.use-var(shadow, emboss);
transition:
  border-color 0.25s ease,
  box-shadow 0.25s ease;

&:hover {
  border-color: fn.use-var(color, primary);
}

@include m.is(disabled) {
  background-color: fn.use-var(color, disabled);
  box-shadow: none;
}
```

- [ ] **Step 2: 视觉验证 multi-select**

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/multi-select/style.scss
git commit -m "feat(multi-select): replace inset shadow with real border + emboss shadow"
```

---

## Task 7: Multi-Tree-Select — 同上改造

**Files:**

- Modify: `packages/desktop/src/components/multi-tree-select/style.scss`

- [ ] **Step 1: 修改 multi-tree-select 组件样式**

改前 key lines:

```scss
box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
transition: box-shadow 0.25s ease;

&:hover {
  box-shadow: inset 0 0 1px 1px fn.use-var(color, primary);
}

@include m.is(disabled) {
  cursor: not-allowed;
  background-color: fn.use-var(color, disabled);
  box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
}
```

改后:

```scss
border: fn.use-var(border);
box-shadow: fn.use-var(shadow, emboss);
transition:
  border-color 0.25s ease,
  box-shadow 0.25s ease;

&:hover {
  border-color: fn.use-var(color, primary);
}

@include m.is(disabled) {
  cursor: not-allowed;
  background-color: fn.use-var(color, disabled);
  box-shadow: none;
}
```

- [ ] **Step 2: 视觉验证 multi-tree-select**

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/multi-tree-select/style.scss
git commit -m "feat(multi-tree-select): replace inset shadow with real border + emboss shadow"
```

---

## Task 8: Date-Range-Picker — 同上改造

**Files:**

- Modify: `packages/desktop/src/components/date-range-picker/style.scss`

- [ ] **Step 1: 修改 date-range-picker 组件样式**

改前 key lines:

```scss
box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
transition: box-shadow 0.25s ease;

&:hover {
  box-shadow: inset 0 0 0px 1px fn.use-var(color, primary);
}

@include m.is(disabled) {
  background-color: fn.use-var(color, disabled);
  box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
}
```

改后:

```scss
border: fn.use-var(border);
box-shadow: fn.use-var(shadow, emboss);
transition:
  border-color 0.25s ease,
  box-shadow 0.25s ease;

&:hover {
  border-color: fn.use-var(color, primary);
}

@include m.is(disabled) {
  background-color: fn.use-var(color, disabled);
  box-shadow: none;
}
```

注意：原 hover 的 `inset 0 0 0px 1px` 中的 `0px` 是 typo，在 border 方案中自然消除。

- [ ] **Step 2: 视觉验证 date-range-picker**

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/date-range-picker/style.scss
git commit -m "feat(date-range-picker): replace inset shadow with real border + emboss shadow"
```

---

## Task 9: Cascade (is-multiple) — 同上改造

**Files:**

- Modify: `packages/desktop/src/components/cascade/style.scss`

- [ ] **Step 1: 修改 cascade 组件 `.is-multiple` 修饰符中的 inset shadow**

改前 key lines (在 `@include m.is(multiple)` 块内):

```scss
box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
transition: box-shadow 0.25s ease;

&:hover {
  box-shadow: inset 0 0 1px 1px fn.use-var(color, primary);
}
```

改后:

```scss
border: fn.use-var(border);
box-shadow: fn.use-var(shadow, emboss);
transition:
  border-color 0.25s ease,
  box-shadow 0.25s ease;

&:hover {
  border-color: fn.use-var(color, primary);
}
```

注意：cascade 的 disabled 状态没有特定 inset shadow 覆盖（仅 `.is-disabled` 设置了文字颜色），但需要确认 disabled 时是否需要隐藏 emboss shadow。检查 cascade 是否有 disabled 状态下的边框处理。当前文件中未看到 disabled 下的边框/阴影覆盖，所以不改。

- [ ] **Step 2: 视觉验证 cascade**

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/cascade/style.scss
git commit -m "feat(cascade): replace inset shadow with real border + emboss shadow"
```

---

## Task 10: Auto-Complete (is-multiple) — 同上改造

**Files:**

- Modify: `packages/desktop/src/components/auto-complete/style.scss`

- [ ] **Step 1: 修改 auto-complete 组件的 `.is-multiple` 和 disabled 状态**

`@include m.is(multiple)` 块中：

```scss
// 改前
box-shadow: inset 0 0 1px 1px fn.use-var(border, color);
transition: box-shadow 0.25s ease;

&:hover {
  box-shadow: inset 0 0 1px 1px fn.use-var(color, primary);
}

// 改后
border: fn.use-var(border);
box-shadow: fn.use-var(shadow, emboss);
transition:
  border-color 0.25s ease,
  box-shadow 0.25s ease;

&:hover {
  border-color: fn.use-var(color, primary);
}
```

`@include m.is(disabled)` 块中：

```scss
// 改前
box-shadow: inset 0 0 1px 1px fn.use-var(border, color);

// 改后
box-shadow: none;
```

- [ ] **Step 2: 视觉验证 auto-complete**

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/auto-complete/style.scss
git commit -m "feat(auto-complete): replace inset shadow with real border + emboss shadow"
```

---

## Task 11: Code-Editor — 组件级变量 border 改造

**Files:**

- Modify: `packages/desktop/src/components/code-editor/style.scss`

- [ ] **Step 1: 修改 code-editor 的边框模式**

code-editor 使用组件级变量 `--u-code-editor-border` 控制边框颜色，当前模式为 `box-shadow: inset 0 0 0 1px`。改为真实 border。

改前 key lines:

```scss
box-shadow: inset 0 0 0 1px var(--u-code-editor-border);
transition: box-shadow 0.2s ease;

&:hover,
&:focus-within {
  box-shadow: inset 0 0 0 1px fn.use-var(color, primary);
}
```

改后:

```scss
border: 1px solid var(--u-code-editor-border);
box-shadow: fn.use-var(shadow, emboss);
transition:
  border-color 0.2s ease,
  box-shadow 0.2s ease;

&:hover,
&:focus-within {
  border-color: fn.use-var(color, primary);
}
```

disabled 状态改前:

```scss
@include m.is(disabled) {
  background-color: fn.use-var(color, disabled);
  box-shadow: inset 0 0 0 1px var(--u-code-editor-border);
  cursor: not-allowed;

  &:hover,
  &:focus-within {
    box-shadow: inset 0 0 0 1px var(--u-code-editor-border);
  }
}
```

改后:

```scss
@include m.is(disabled) {
  background-color: fn.use-var(color, disabled);
  box-shadow: none;
  cursor: not-allowed;

  &:hover,
  &:focus-within {
    border-color: var(--u-code-editor-border);
  }
}
```

readonly 状态改前:

```scss
@include m.is(readonly) {
  box-shadow: inset 0 0 0 1px var(--u-code-editor-border);

  &:hover,
  &:focus-within {
    box-shadow: inset 0 0 0 1px var(--u-code-editor-border);
  }
}
```

改后:

```scss
@include m.is(readonly) {
  &:hover,
  &:focus-within {
    border-color: var(--u-code-editor-border);
  }
}
```

注意：readonly 状态移除了显式的 `box-shadow` 和 `border-color` 声明，回到默认的 `border: 1px solid var(--u-code-editor-border)` 和 `box-shadow: var(--u-shadow-emboss)`，只是 hover/focus 时不改变 border-color。`background-color` 不变。

- [ ] **Step 2: 视觉验证 code-editor**

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/code-editor/style.scss
git commit -m "feat(code-editor): replace inset shadow with real border + emboss shadow"
```

---

## Task 12: Form-Item error 状态 — 从 inset shadow 改为 border-color

**Files:**

- Modify: `packages/desktop/src/components/form-item/style.scss`

- [ ] **Step 1: 修改 form-item error 状态覆盖**

改前:

```scss
@include m.is(error) {
  #{fn.bem(input)},
  #{fn.bem(multi-select),
  #{fn.bem(multi-tree-select)},
  #{fn.bem(auto-complete)},
  #{fn.bem(textarea--more)}} {
    box-shadow: inset 0 0 1px 1px fn.use-var(color, danger);
  }
}
```

改后:

```scss
@include m.is(error) {
  #{fn.bem(input)},
  #{fn.bem(multi-select)},
  #{fn.bem(multi-tree-select)},
  #{fn.bem(auto-complete)},
  #{fn.bem(textarea--more)}} {
    border-color: fn.use-var(color, danger);
  }
}
```

注意：原代码中 `fn.bem(multi-select),` 后面少了一个右括号，实际上渲染为 `.u-multi-select`。需要保持原有选择器列表不变（只是括号问题，这里不需要修）。具体来说查看原始文件确认精确的选择器。

- [ ] **Step 2: 视觉验证 form-item 的 error 状态**

在 playground 中给 input 等组件设置 error 状态，验证红色边框是否正常显示。

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/form-item/style.scss
git commit -m "feat(form-item): replace error inset shadow with border-color override"
```

---

## Task 13: Button — 增加 emboss 阴影

**Files:**

- Modify: `packages/desktop/src/components/button/style.scss`

- [ ] **Step 1: 为 button 默认状态增加 emboss shadow**

在 button 根块中，将 `transition` 和 shadow 相关行修改：

改前:

```scss
border: none;
background-color: fn.use-var(color, default);
transition:
  background-color 0.25s,
  box-shadow 0.2s;
```

改后:

```scss
border: none;
background-color: fn.use-var(color, default);
box-shadow: fn.use-var(shadow, emboss);
transition:
  background-color 0.25s,
  box-shadow 0.2s;
```

默认按钮保持 `border: none`，仅加 `box-shadow: fn.use-var(shadow, emboss)`。

`:active` 状态已有 `box-shadow: none;`，点击时自动取消浮雕——这是正确的触觉反馈。

`.is-disabled, .is-loading` 状态已有 `box-shadow: none !important;`，同样自会移除浮雕。

- [ ] **Step 2: 视觉验证 button**

检查：

- 默认主题：按钮无额外阴影（emboss 为 none）
- hero 主题：按钮有浮雕浮起阴影
- 按下时：阴影消失（active）
- disabled/loading：无阴影

- [ ] **Step 3: Commit**

```bash
git add packages/desktop/src/components/button/style.scss
git commit -m "feat(button): add emboss shadow to default button"
```

---

## Task 14: Type Check & Lint & 视觉回归验证

**Files:**

- 无新文件

- [ ] **Step 1: 运行 type check**

Run: `bun run check-types`

预期：0 errors。

- [ ] **Step 2: 运行 lint**

Run: `bun run lint`

预期：0 errors（或仅有预先存在的 warnings）。

- [ ] **Step 3: 运行 build**

Run: `bun run build`

预期：成功完成。

- [ ] **Step 4: Playground 视觉回归验证**

Run: `cd playgrounds/desktop && bun dev`

在浏览器中逐个验证所有受影响组件：

- [ ] Input（默认、hover、focus、disabled、error 状态）
- [ ] Textarea（同上）
- [ ] Multi-Select（同上）
- [ ] Multi-Tree-Select（同上）
- [ ] Date-Range-Picker（同上）
- [ ] Cascade（multiple 模式）
- [ ] Auto-Complete（multiple 模式）
- [ ] Code-Editor（默认、hover、focus、disabled、readonly、dark 模式）
- [ ] Button（默认、plain、text、disabled、各颜色）
- [ ] Form-Item（error 状态）

分别验证默认主题和 hero 主题下的表现。

- [ ] **Step 5: 最终 Commit（如有必要）**

如果视觉验证发现需要微调，在此修复并提交。否则跳过。
