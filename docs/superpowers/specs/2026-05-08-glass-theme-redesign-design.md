# Glass Theme & Showcase 深色模式优化设计

## 日期：2026-05-08
## 状态：已批准

---

## 1. 问题陈述

当前 Glass（玻璃）主题存在两个问题：

1. **玻璃效果不明显**：背景不透明度太高（`0.6~0.8`）、模糊半径太小（`12px`），导致卡片看起来接近纯色背景，缺乏玻璃质感。
2. **Showcase 示例对深色模式不友好**：
   - 背景仅有一层淡色网格，深色模式下几乎不可见。
   - `App.vue` 多处硬编码 `background: #fff`，深色模式下玻璃卡片背后是白色，完全破坏玻璃效果。
   - Showcase 卡片自身写死了 `backdrop-filter: blur(20px)`，会与主题层的滤镜叠加。

---

## 2. 设计目标

1. 让玻璃主题真正体现 Glassmorphism（毛玻璃）质感：高模糊、低不透明度、半透明边框、悬浮阴影。
2. Showcase 背景提供丰富的底层色彩和明暗变化，供玻璃折射。
3. 修复所有硬编码颜色，确保深色模式下的玻璃效果与浅色模式一致出色。
4. **不破坏其他主题预设**（default、shadcn、hero）。

---

## 3. 模块一：Glass 主题 Token 重定义

### 3.1 文件位置
`packages/styles/src/theme/glass.ts`

### 3.2 Light Mode 变更

| Token | 旧值 | 新值 |
|-------|------|------|
| `bg.color.bottom` | `rgba(255,255,255,0.6)` | `rgba(255,255,255,0.2)` |
| `bg.color.middle` | `rgba(255,255,255,0.7)` | `rgba(255,255,255,0.3)` |
| `bg.color.top` | `rgba(255,255,255,0.8)` | `rgba(255,255,255,0.4)` |
| `bg.color.hover` | `rgba(255,255,255,0.9)` | `rgba(255,255,255,0.55)` |
| `bg.filter.blur` | `blur(12px)` | `blur(24px)` |
| `bg.filter.saturate` | `saturate(150%)` | `saturate(180%)` |
| `border.color` | `#E2E8F0` | `rgba(255,255,255,0.35)` |
| `shadow.color` | `rgba(0,0,0,0.04)` | `rgba(0,0,0,0.08)` |
| `shadow.blur` | `16px` | `24px` |

### 3.3 Dark Mode 变更

| Token | 旧值 | 新值 |
|-------|------|------|
| `bg.color.bottom` | `rgba(15,23,42,0.6)` | `rgba(10,15,30,0.2)` |
| `bg.color.middle` | `rgba(15,23,42,0.7)` | `rgba(15,23,42,0.3)` |
| `bg.color.top` | `rgba(15,23,42,0.8)` | `rgba(15,23,42,0.4)` |
| `bg.color.hover` | `rgba(30,41,59,0.8)` | `rgba(30,41,59,0.55)` |
| `bg.filter.blur` | 继承 `12px` | `blur(32px)` |
| `bg.filter.saturate` | 继承 `150%` | `saturate(200%)` |
| `border.color` | `#27272A` | `rgba(255,255,255,0.08)` |
| `shadow.color` | `rgba(0,0,0,0.2)` | `rgba(0,0,0,0.35)` |
| `shadow.blur` | `16px` | `32px` |

### 3.4 未变更项

- `color.primary`、`color.success` 等色板保持 vibrant 风格。
- `text-color` 全系保持原 slate 值（light: `#1E293B` / dark: `#F8FAFC`），对比度充足无需调整。
- `radius`、`gap`、`form-component-height`、`font-family` 继承自 `lightTheme`，无需覆盖。

---

## 4. 模块二：Showcase 沉浸式背景

### 4.1 文件位置
`playgrounds/desktop/src/showcase/index.vue`

### 4.2 背景层架构

从底到顶共四层：
1. **底色层**：`#f0f4f8`（light）/ `#0a0f1e`（dark）
2. **径向渐变光斑层**：2-3 个大型椭圆渐变，使用蓝/紫/青色低透明度版本
3. **细网格层**：50px 间距网格线，透明度 `0.06`
4. **浮动装饰球层**：3-5 个绝对定位的模糊圆形，缓慢浮动动画

### 4.3 背景实现（SCSS 伪元素）

**Light Mode：**
```css
background-color: #f0f4f8;
background-image:
  radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.12), transparent),
  radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.10), transparent),
  radial-gradient(ellipse 50% 60% at 50% 80%, rgba(14, 165, 233, 0.08), transparent);
```

**Dark Mode：**
```css
background-color: #0a0f1e;
background-image:
  radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.18), transparent),
  radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.15), transparent),
  radial-gradient(ellipse 50% 60% at 50% 80%, rgba(14, 165, 233, 0.12), transparent);
```

### 4.4 网格层修复

旧代码使用 `-webkit-mask-image` 和 `rgba(0,0,0,0.15)` 做 mask，在深色背景下会让网格完全消失。新方案改为直接降低网格线自身透明度，不使用 mask：

- Light: `linear-gradient(..., rgba(0,0,0,0.06) 1px, transparent 1px)`
- Dark: `linear-gradient(..., rgba(255,255,255,0.06) 1px, transparent 1px)`

网格通过 `[data-theme='dark']` 或 `@media (prefers-color-scheme: dark)` 选择器切换颜色（Showcase 使用 `<style scoped>` 纯 CSS，不使用 SCSS mixin）。

### 4.5 浮动装饰球

增加 3 个 `.orb` 元素：

- 尺寸：`300px` ~ `500px`
- 形状：`border-radius: 50%`
- 模糊：`filter: blur(80px)`
- 颜色（light）：`rgba(59,130,246,0.08)`、`rgba(139,92,246,0.06)`、`rgba(14,165,233,0.07)`
- 颜色（dark）：`rgba(59,130,246,0.15)`、`rgba(139,92,246,0.12)`、`rgba(14,165,233,0.10)`
- 动画：`float 20s ease-in-out infinite`（上下 `±20px` 浮动，各自错开相位）

### 4.6 响应式

背景层在移动端保持不变，光斑和装饰球自动适应视口。网格线密度保持不变。

---

## 5. 模块三：App.vue 硬编码修复 + Showcase 卡片清理

### 5.1 文件位置
- `playgrounds/desktop/App.vue`
- `playgrounds/desktop/src/showcase/index.vue`

### 5.2 App.vue 修复清单

| 选择器 | 旧值 | 新值 | 理由 |
|--------|------|------|------|
| `.main` | `background-color: #fff` | `background-color: use-var(bg-color, bottom)` | 跟随主题 |
| `.content-container` | `background: #fff` | `background: use-var(bg-color, bottom)` | 跟随主题 |
| `.control-bar` | `border-bottom: 1px solid rgba(255,255,255,0.1)` | `border-bottom: 1px solid use-var(border, color)` | 跟随主题 |
| `.control-bar` | `border-top: 1px solid rgba(255,255,255,0.05)` | 移除 | 多余且浅色下不可见 |

### 5.3 Showcase 卡片清理

1. **移除 `.bento-card` 的硬编码 `backdrop-filter: blur(20px)`**
   - 旧代码：`backdrop-filter: blur(20px);`
   - 原因：与 glass 主题的 `--u-bg-filter` 叠加会导致过度模糊；其他主题不需要。
   - 修改：直接删除该行。卡片背景由 `background: var(--u-bg-color-top)` 和主题注入的 `--u-bg-filter` 共同控制。

2. **Hover 阴影变量化**
   - 旧代码：`box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);`
   - 新代码：`box-shadow: 0 20px 40px var(--u-shadow-color, rgba(0,0,0,0.06));`
   - 原因：glass 主题的阴影颜色更深，需要跟随主题变量。

3. **Hero 阴影按钮兼容性检查**
   - `.shadow-btn` 使用 `rgba(var(--u-color-primary-rgb, 30, 136, 229), 0.3)`
   - **验证方式**：在浏览器 DevTools 中检查 `--u-color-primary-rgb` 是否已定义。`UITheme` 通常会自动为所有 color token 生成 RGB 后缀变量。
   - **回退方案**：如果未生成，将 `rgba(var(--u-color-primary-rgb, 30, 136, 229), 0.3)` 改为 `color-mix(in srgb, var(--u-color-primary) 30%, transparent)`，兼容性更好且无需 RGB 变量。

4. **图标背景增强（可选优化）**
   - `.icon-bg.primary` 当前使用 `var(--u-color-primary-light-9)`，在玻璃低透明度背景下可能对比度不足。
   - **首选方案**：`background: color-mix(in srgb, var(--u-color-primary) 12%, transparent)`（不依赖 RGB 变量）。
   - **回退方案**：保持原样，`#3B82F6` 的 light-9 版本在白色 `0.4` 背景上仍然可见。

---

## 6. 技术约束与兼容性

1. **Dart Sass + `pkg:` 导入**：Showcase 的 `<style scoped>` 使用纯 CSS，不依赖 SCSS 变量函数。App.vue 的 `<style lang="scss">` 已定义 `use-var` 函数，可直接使用。
2. **深色模式切换**：`UITheme.setTheme('dark')` 会通过 `html[data-theme="dark"]` 注入变量。Showcase 背景中 dark 专用的样式应使用 `@media (prefers-color-scheme: dark)` 或 `[data-theme='dark']` 选择器，与主题系统保持一致。
3. **CSS 自定义属性**：所有改动基于 CSS 变量，不引入新的 JS 依赖。
4. **性能**：`backdrop-filter: blur(32px)` 在复杂页面上可能有性能开销。Showcase 页面卡片数量约 10 个，在 modern 浏览器上可接受。如后续发现性能问题，可将 `blur` 降级到 `24px`。

---

## 7. 测试清单

- [ ] 切换到 glass 主题，浅色模式：卡片可见玻璃折射效果，文字可读。
- [ ] 切换到 glass 主题，深色模式：卡片可见玻璃折射效果，背景光斑可见，文字可读。
- [ ] 切换到 default 主题：Showcase 表现无异常（背景色跟随 `bg-color-bottom`，卡片无多余模糊）。
- [ ] 切换到 shadcn / hero 主题：同上，无异常。
- [ ] 切换主题尺寸（small / default / large）：布局正常。
- [ ] 移动端（< 768px）：背景层和卡片布局正常。

---

## 8. 变更文件清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `packages/styles/src/theme/glass.ts` | 修改 | 重定义 glassLightTheme 和 glassDarkTheme 的 bg/filter/border/shadow token |
| `playgrounds/desktop/src/showcase/index.vue` | 修改 | 重写背景层（底色+光斑+网格+装饰球），移除卡片硬编码 backdrop-filter，变量化阴影 |
| `playgrounds/desktop/App.vue` | 修改 | 修复 `.main`、`.content-container`、`.control-bar` 的硬编码颜色 |

---

## 9. 附录：参考设计

- **Glassmorphism 设计规范**：高模糊（`20px+`）、低不透明度（`0.2~0.4`）、半透明边框、弥散阴影、丰富的底层背景。
- **Apple macOS / iOS 玻璃效果**：使用 `backdrop-filter: blur(40px) saturate(180%)`，配合深色/浅色动态背景。
- **Tailwind CSS Glass**：参考其 `backdrop-blur-xl`、`bg-white/10`、`border-white/20` 等 token 比例。
