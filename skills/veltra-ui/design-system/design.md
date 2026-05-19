# Ultra UI 设计系统 (Design System)

> **Category**: Sleek Component Systems  
> **Version**: 3.x  
> **Architecture**: Three-File AI-Native Schema (tokens.css + DESIGN.md + components.vue)

本文档是 Ultra UI 组件库的核心设计白皮书与 AI-Native 约束协议。它定义了全局的主题规范、BEM 架构规范、CSS 变量映射规则，并为开发新组件与优化现有 UI 提供了完整的设计准则。

为了最大化地在**代理技能 (Agent Skills)** 中实现对 AI 代理的精准赋能与零开销解析，Ultra UI 设计系统拆分为三个高度解耦的文件：
1. [tokens.css](tokens.css) — **零开销机器可读变量定义**。彻底抛弃 YAML frontmatter，使用原生 CSS 标准 `:root` 和 `[data-theme]` 级联，供机器及浏览器直接应用。
2. [design.md](design.md)（本文档）— **人机共读的核心设计白皮书与 Agent 级规范红黑榜**。
3. [components.vue](components.vue) — **完美无瑕的 Few-shot SFC 模版**。提供最高水准的 Vue 3 + TS + BEM + SCSS 组件实战参考。

---

## 1. 概述与设计哲学

Ultra UI 是一个专为 Vue 3 开发的高性能、极致体验的桌面端组件库。我们的设计核心在于**多态表现力**与**极致性能的平衡**。通过将所有设计语义抽取成 CSS 变量，结合 TypeScript 侧的主题编译器 `UITheme`，Ultra UI 能够做到不损耗任何渲染性能的前提下，秒级切换迥异的视觉风格。

### 核心设计原则

1. **语义化变量 (Semantic Tokens)**：不直接在 SCSS 中使用硬编码的值，所有颜色、边框、阴影、圆角均通过 `--u-*` 变量与 SCSS `use-var` 函数连接。
2. **多态视觉 (Visual Polymorphism)**：支持四大系统预置主题风格：
   - **Standard (标准)** - 严谨经典的现代扁平化软件风格。
   - **Shadcn (极简)** - 极简主义、高对比度、无极渐变的高级 SaaS 质感。
   - **Hero (浓烈/极客)** - 紫色为主调、超大圆角、重阴影与精致浮雕（Emboss）的活力先锋风格。
   - **Glass (毛玻璃/流光)** - 融合背景高斯模糊、细腻半透明边框与流光的拟物微光质感。
3. **高响应度与微交互 (Micro-interactions)**：状态过渡均配有顺滑动画，微调阴影和位移使每次点击反馈都充满灵性。
4. **BEM + 局部组件变量封装**：底层样式架构采用严格 BEM 命名法，结合局部组件级 `--u-{component}-*` 变量对特定交互进行微调。

---

## 2. 视觉预设与主题系统

Ultra UI 在 `theme` 目录下集成了 4 套系统级视觉规范。所有主题均由 `UITheme` 实例统一编译并注入 `<html>` 标签，完美兼容 `data-theme` 属性与系统的 `prefers-color-scheme`（暗色偏好）。

| 主题预设 (Theme Presets) | 核心视觉特征 | 适用场景 |
| :--- | :--- | :--- |
| **Standard (标准)** | 扁平、高可读性、经典的冷灰基底，主色为深邃蓝 (#1E88E5) | 后台管理、复杂表格、数据分析平台 |
| **Shadcn (极简)** | 极致硬核黑白、小圆角 (6px)、微细单像素阴影，锌灰 (Zinc) 极简质感 | 开发者工具、现代化文档、AI 产品、SaaS 面板 |
| **Hero (先锋)** | 绚丽极客紫 (#7828c8)、大圆角 (12px)、层叠模糊大阴影与 `emboss` 浮雕效果 | 创意设计社区、C端活动、潮流后台、仪表盘 |
| **Glass (拟物玻璃)** | 背景模糊滤波 (`blur(24px) saturate(180%)`)、半透明柔和边框与丰富投影 | 多彩潮流官网、大屏数据可视化、轻量工具套件 |

---

## 3. 颜色系统 (Color Tokens)

颜色系统分为 **品牌/状态色**、**背景色**、**文字色** 三个维度，并通过 `UITheme` 在运行时动态混色，生成额外的亮色/暗色梯度（`light-[1-9]` 与 `dark-[1-9]`）。

### 3.1 品牌与反馈色 (Brand & Status Colors)

```
[Primary 主色]   ──────► 页面核心交互，如按钮、高亮选中、聚焦输入框
[Success 成功]   ──────► 表单校验成功、标签状态、运行通过
[Warning 警告]   ──────► 风险操作提示、未完结状态
[Danger 危险]    ──────► 强力警告、删除动作、出错状态
[Info 信息]      ──────► 中性提示信息、流程状态
[Disabled 禁用]  ──────► 组件置灰态
[Default 默认]    ──────► 默认按钮背景、中性边界
```

> **具体色值对照表** 请直接查阅机器级 [tokens.css](tokens.css) 以获取各主题最新 Hex 映射。

### 3.2 动态混色映射 (Dynamic Tint/Shade Mixing)

`UITheme` 在加载时会读取品牌色 Hex 值，并根据 rates `[1, 3, 5, 7, 9]` 动态生成如下变量：
- **`--u-color-{type}-light-{rate}`**: 主色混合白色生成亮色，常用于 **悬停背景 (Light-9)**、**弱警告条**等。
- **`--u-color-{type}-dark-{rate}`**: 主色混合黑色生成暗色，常用于 **深色点按激活状态**。

### 3.3 背景色语义 (Background Hierarchy)

为避免页面扁平化导致的结构混乱，背景色严格划分了三个高度阶梯：

```
┌──────────────────────────────────────────────┐
│  Bottom BG (--u-bg-color-bottom)             │  ◄── 页面底层基色 (如 #f5f5f5 / #0f0f0f)
│  ┌────────────────────────────────────────┐  │
│  │  Middle BG (--u-bg-color-middle)       │  │  ◄── 内容卡片、表单框体等中层背景
│  │  ┌──────────────────────────────────┐  │  │
│  │  │  Top BG (--u-bg-color-top)       │  │  │  ◄── 弹窗、悬浮层、头部菜单最顶层背景
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```
- **`--u-bg-color-hover`**: 列表项、下拉框的滑过背景色。
- **`--u-bg-color-{type}-alpha`**: 将背景色转化成约 66% 透明度的半透明格式，用于玻璃态滤波层。
- **`--u-bg-filter`**: 当启用毛玻璃主题时，为顶部元素应用高精度滤波 CSS：`blur(24px) saturate(180%)`。

### 3.4 字体颜色语义 (Text Hierarchy)

- **`--u-text-color-title`**: 页面大标题、模块标题，具有最高视觉重量 (Contrast)。
- **`--u-text-color-main`**: 正文内容、表单标签，最适阅读深度。
- **`--u-text-color-second`**: 副标题、次要卡片信息。
- **`--u-text-color-placeholder`**: 输入框、选择器的占位提示。
- **`--u-text-color-assist`**: 表单底部辅助说明、禁用提示。
- **`--u-text-color-disabled`**: 已禁用的文本。
- **`--u-text-color-white`**: 在深色/品牌背景色上渲染的白色文本。

---

## 4. 样式编写最佳实践 (Styling Best Practices)

为保证项目长效稳定、完美兼容 Oxlint 与 TypeScript 编译，所有样式开发均须遵守如下设计路径：

### 4.1 SCSS 变量访问范式

**禁止**在样式表中直接编写 Hex 颜色、硬编码 shadow、或者直接使用 `--u-` 原生语法。应使用辅助函数：
- `fn.use-var($basename, $nodes...)`：用于获取全局主题变量。
- `fn.component-var($component, $property, $fallback)`：用于组件级定制。

```scss
// ❌ 错误示范
.u-button {
  background-color: #1e88e5; /* 硬编码颜色 */
  border-radius: var(--u-radius-default); /* 直接使用 css 原生变量 */
}

// ✅ 正确示范
@use 'pkg:@veltra/styles/src/functions' as fn;

.u-button {
  background-color: fn.use-var('color', 'primary');
  border-radius: fn.use-var('radius', 'default');

  &--disabled {
    background-color: fn.use-var('color', 'disabled');
  }
}
```

### 4.2 BEM 命名法规范

遵循 `.u-{block}__{element}--{modifier}`，并配合 `mixins` 开发。

```scss
@use 'pkg:@veltra/styles/src/mixins' as *;
@use 'pkg:@veltra/styles/src/functions' as fn;

@include b(card) {
  background: fn.use-var('bg-color', 'top');
  border: fn.use-var('border');

  @include e(header) {
    padding: fn.use-var('gap', 'default');
    color: fn.use-var('text-color', 'title');
  }

  @include m(hoverable) {
    &:hover {
      box-shadow: fn.use-var('shadow');
    }
  }
}
```

---

## 5. 设计规范红黑榜 (Do's & Don'ts)

### 🔴 黑榜 (Don'ts)
- **不要**在组件的 `style.scss` 里写任何 Hex 色值（如 `#fff`, `#333` 等），必须映射到 `text-color`, `bg-color` 变量上。
- **不要**混合使用 Tailwind CSS 与 BEM 类。Ultra UI 是纯血 TypeScript + BEM 架构。
- **不要**随意在组件内手动编写 `transition: all 0.3s`，应使用统一的动画过渡曲线以防卡顿。
- **不要**在 `packages/styles` 之外的地方建立重复的 Theme Token 数据集。
- **不要**跳过 TypeScript 的类型定义去强写组件 CSS 覆盖，所有暴露的局部变量必须有 TS 声明类型支持。

### 🟢 红榜 (Do's)
- **必须**在使用 `use-var` 获取颜色时，为 Hover/Active 等交互状态准备对应的 Tint 变量（例如 `mixColor` 或 `light-9`）。
- **必须**在提交代码前使用 `bun run check-types` 保证类型编译自洽。
- **必须**让组件的边框厚度、边框样式受控于 `--u-border-width` 和 `--u-border-style`，以便一键适配 Hero 等粗无痕边框主题。
- **必须**让所有交互按键自带微弱动效与微交互，充分匹配 Ultra UI 的极致流畅体验。

---

## 6. AI Agent 开发指南 (Agent Development Guide)

> **[!IMPORTANT]**  
> 当你（AI 编码助手）需要在 Ultra UI 组件库中新增或优化任何 UI 组件时，**必须**强制执行本节指南！

### 6.1 变量访问自动化拦截 (Variables Verification)
- **禁止硬编码字面值**：如果你打算写入诸如 `#333`、`rgba(0,0,0,0.1)`、`12px` 等具体物理字面量，必须立即中断，并在 [tokens.css](tokens.css) 中寻找相对应的语义变量，然后用 `fn.use-var()` 映射它。
- **边框与阴影自适应**：始终配合 BEM 主题规范使用 `fn.use-var('shadow-emboss')` 和 `fn.use-var('shadow')`，确保在 Hero 主题下能够正确溢出 Emboss（浮雕）质感，而在标准主题下表现为无效果。

### 6.2 零侵入 Few-shot 实战指引 (SFC Fixture Adaptation)
- **第一步**：在开始编码新组件前，**必须先阅读** [components.vue](components.vue) 中的完整结构。
- **第二步**：严格复用 `components.vue` 中所展示的 BEM 组合方法 `bem('component-name')` 获得 `cls` 实例。
- **第三步**：在 Vue 模板中，通过 `:class="[cls.b, cls.m(size)]"` 进行最精确的声明，杜绝在模板内手动拼接带有 `u-` 前缀的字符串。

### 6.3 规避 Monorepo 循环依赖 (Monorepo Circular Safety)
- **核心红线**：`packages/styles` 里的 `theme` 在运行时依赖 `@veltra/compositions` (`useConfig`)，因此 **`compositions` 绝不能反向导出 `theme`**，否则必将发生包的死锁循环。
- **如何解决**：在 `compositions` 包开发时，若涉及主题相关的状态提取，请只读取底层的全局配置或通过 InjectionKey，严禁引入 `import ... from '@veltra/styles/theme'`。
