# 创建 use-utils 和 use-directives 文档型技能

> 状态: 已执行

## 目标

为 `@veltra/utils`（DOM 操作、BEM 工厂、表单校验、响应式代理等工具函数 + 共享类型）和 `@veltra/directives`（3 个 Vue 自定义指令）分别创建文档型技能。这两个包体量较小，各自独立为一个技能。

## 内容

### 1. 创建 veltra-utils 技能

目录结构：

```
skills/veltra-utils/
├── SKILL.md                    # 工具函数目录、导入约定（≤200 行）
├── scripts/
│   └── sync-docs.ts            # 同步脚本：从 utils/src/ 提取完整源码
├── generated/
│   ├── manifest.json
│   ├── api-reference.md        # 全部工具函数的完整源码
│   └── shared-types.md         # 共享类型定义（ComponentSize, FormComponentProps 等）
└── references/
    └── bem-guide.md            # BEM 类名工具使用指南
```

**SKILL.md 内容**：

- frontmatter：触发词包括"工具函数、BEM、DOM、校验、Validator、z-index、类名"等
- 按模块分组的函数目录：
  - DOM（addClass/removeClass, getScrollParents, scrollIntoContainerView, withUnit, setStyles/removeStyles, zIndex, getHighlightChunks）
  - 表单校验（Validator）
  - 辅助（bem, makeBEM, createIncrease, createToggle, Tween, nextFrame, shallowComputed）
  - Vue 辅助（isTextNode, isFragment, isComment, isTemplate, extractNormalVNodes）
  - 响应式（middleProxy）
  - 常量（NAME_SPACE, CLS_PREFIX, FORM_EMPTY_CONTENT）
- 导入约定（`import { xxx } from '@veltra/utils'`，子路径 `@veltra/utils/shared`）
- 共享类型速查（ComponentSize, ColorType, FormComponentProps 等常用类型）

**同步脚本**：逐文件读取 `packages/utils/src/` 下所有 `.ts` 文件完整源码。按模块目录组织输出：`dom/*.ts` → DOM 章节、`form/*.ts` → 表单章节、`helper/*.ts` → 辅助章节、`reactive/*.ts` → 响应式章节、`shared/*.ts` + `types/*.ts` → shared-types.md。

**bem-guide.md**：

- `bem` 实例的完整 API（`bem.b()`, `bem.e()`, `bem.m()`, `bem.is()` 等方法签名和返回值）
- 在组件 `.vue` 中使用 BEM 类名的典型模式（从 desktop 组件 button.vue 等提取真实代码）
- `makeBEM` 自定义前缀工厂

### 2. 创建 veltra-directives 技能

目录结构：

```
skills/veltra-directives/
├── SKILL.md                    # 指令目录、用法速查（≤150 行）
├── scripts/
│   └── sync-docs.ts            # 同步脚本
└── generated/
    ├── manifest.json
    └── api-reference.md        # 3 个指令的完整源码
```

**SKILL.md 内容**：

- frontmatter：触发词包括"指令、directive、vFocus、vClickOutside、vRipple、水波纹、点击外部、聚焦"等
- 3 个指令的快速用法（每个 5-8 行示例代码）：
  - `vFocus`：`<input v-focus />` 或 `<div v-focus>` 容器内自动查找 input
  - `vClickOutside`：`<div v-click-outside="handleClose">` 绑定回调
  - `vRipple`：`<button v-ripple>` 启用、`<button v-ripple="false">` 禁用、`<button v-ripple:300>` 自定义时长、`<button v-ripple="'custom-class'">` 自定义类名
- 注册方式：全局注册（`app.use(UltraUI)`）vs 按需注册（`app.directive('focus', vFocus)`）
- 样式依赖：`vRipple` 需引入 `@veltra/directives/ripple/style`

**同步脚本**：读取 `packages/directives/src/` 下所有 `.ts` 和 `.scss` 文件完整源码，按指令组织输出到 `api-reference.md`。

### 3. 注册同步命令

在根 `package.json` 添加：

- `"sync-veltra-utils": "bun skills/veltra-utils/scripts/sync-docs.ts"`
- `"sync-veltra-directives": "bun skills/veltra-directives/scripts/sync-docs.ts"`

## 影响范围

- `skills/veltra-utils/SKILL.md`
- `skills/veltra-utils/scripts/sync-docs.ts`
- `skills/veltra-utils/references/bem-guide.md`
- `skills/veltra-utils/generated/manifest.json`
- `skills/veltra-utils/generated/api-reference.md`
- `skills/veltra-utils/generated/shared-types.md`
- `skills/veltra-directives/SKILL.md`
- `skills/veltra-directives/scripts/sync-docs.ts`
- `skills/veltra-directives/generated/manifest.json`
- `skills/veltra-directives/generated/api-reference.md`
- `package.json`（新增 `sync-veltra-utils`、`sync-veltra-directives` 脚本）

## 历史补丁
