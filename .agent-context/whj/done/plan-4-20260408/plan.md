# @ultra-ui/icons 资源与构建管线

> 状态: 已执行

## 目标

在 `packages/icons` 中建立可维护的 SVG 图标工作流：统一文件命名、用工具自动规范化 SVG 内容、从 SVG 批量生成可在 Vue 3 中使用的组件，并通过 `package.json` 的 `exports` 支持按图标路径按需解析，使打包器仅打入实际引用的模块。与现有 `@ultra/icon` 无强制导出名对齐（独立演进）；若日后迁移 desktop，可另起计划。

## 内容

### 1. 制定并落地 SVG 文件命名规范

**规范（实现阶段写入单一真源，例如 `packages/icons/scripts/icon-naming.ts` 顶部注释与常量）**：

- 仅使用 **kebab-case**、小写、ASCII；词段用 `-` 连接；禁止空格与中文文件名。
- 语义清晰：优先「对象-状态/变体」顺序（如 `circle-check`、`circle-check-filled`）；**分类由目录 `normal/`、`colorful/` 表达，文件名不重复 `normal-`/`colorful-` 前缀**。
- 与常见英文拼写一致；对明显笔误（如 `sort-rigth.svg`）在重命名步骤中修正为 `sort-right.svg`。

**执行步骤**：

- 扫描 `packages/icons/src/svg/**/*.svg`，生成「当前 basename → 建议名」清单（脚本 stdout 或临时文件），对仅连字符/拼写规范化的文件给出明确新名。
- 对重名冲突（合并后同名）在清单中标记并裁定后缀（如 `-outline`），禁止静默覆盖。
- 使用 `git mv` 批量重命名；完成后在仓库根对**旧 basename** 执行 `rg`/`git grep`，确认无残留引用（脚本路径、样例、生成物以外的文档）。

**完成标准**：`src/svg` 下 SVG 均符合规范；无未解决重名；已知笔误已更正；全仓无指向旧文件名的引用。

### 2. 自动格式化（优化）SVG

**技术选型**：沿用 `packages/icons/src/svg/svgo.config.js`（`preset-default`、`removeDimensions`、`removeAttrs` 去掉 `class` 等），在 `packages/icons` 增加 **svgo** 依赖（版本写入 `package.json`，与仓库其余包锁定策略一致），以 **SVGO 3** 编程 API 批量处理。

**实现**：

- 新增 `packages/icons/scripts/format-svg.ts`（Bun 执行），递归处理 `src/svg/normal/**/*.svg` 与 `src/svg/colorful/**/*.svg`；脚本内 `import` 或 `readFileSync` 加载上述 `svgo.config.js`（单一配置源，禁止复制一份配置进脚本字符串）。
- `package.json` 增加 `"icons:format": "bun ./scripts/format-svg.ts"`。
- 行为：读入 → `optimize` → 有变化则写回；打印变更文件数；任一路径失败则非零退出并带路径。

**完成标准**：命令可对全部目标 SVG 成功执行；配置仅维护 `svgo.config.js` 一处。

### 3. 从 SVG 生成 Vue 3 组件

**输出目录**：`packages/icons/src/vue/normal/`、`packages/icons/src/vue/colorful/`，每个源 SVG 对应一个 `.vue`。

**组件约定**：

- `defineOptions({ name: '<PascalCase>' })`，名称由文件名推导：`user-circle.svg` → `UserCircle`。
- 模板根节点为 `<svg>`，保留 `viewBox`；根节点固定 `width="1em"`、`height="1em"`（**不声明任何 Vue props**，尺寸由外层如 `UIcon` 的 `font-size` 决定）。
- **`normal/`**：将单色图形的 `stroke`/`fill` 在生成规则中尽量归一为 `currentColor`（对无法无损转换的路径在实现说明中列表，必要时跳过或手工白名单）。
- **`colorful/`**：保留源中多色 `fill`/`stroke`，生成器不做破坏性统一。

**流水线**：

- 新增 `packages/icons/scripts/gen-vue-icons.ts`：以上一步格式化后的 SVG 为输入；支持按 SVG 内容 hash 与生成器版本标记跳过未变更文件。
- `package.json` 增加 `"icons:gen": "bun ./scripts/gen-vue-icons.ts"`；**不**默认把 `icons:format` 绑进 `prebuild`（避免每次 build 改文件）；在文档化流程中采用「改 SVG → 手动/CI 跑 `icons:format` → `icons:gen` → `build`」顺序。

**完成标准**：每个 SVG 有对应 `.vue`；重复执行输出稳定；在 `apps/sample` 或 `packages/icons` 内最小页面验证单个按需 import 可渲染。

### 4. 按需导出（构建与 `exports`）

**默认构建栈（与 desktop 发布管线对齐，减少新工具分叉）**：在 `packages/icons` 内使用 **`tsdown` + `unplugin-vue/rolldown`**（与 `tools/build/build.ts` 相同组合），`unbundle: true`，`platform: 'browser'`，`format: ['es']`，`sourcemap: true`，`dts: { vue: true }`。`entry` 为生成步骤产出的全部 `src/vue/**/*.vue`（构建脚本在运行时 glob 收集或 codegen 维护入口列表，二选一须在实现 patch 中固定并说明）。`outDir` 建议为 `dist/vue/`，且子目录与源一致（`normal/`、`colorful/`），便于 `exports` 映射。

**`package.json`**：

- 将主 `build` 扩展为：在 `tsc` 之前或之后串联图标构建（具体顺序以实现时不破坏类型检查为准）；声明 `"sideEffects": false` 指向仅含无副作用的 ESM 产物路径（若根入口存在副作用则缩小 `sideEffects` 范围，避免误标）。
- **`exports`**：提供子路径，例如 `@ultra-ui/icons/vue/normal/<basename>`、`@ultra-ui/icons/vue/colorful/<basename>` 映射到 `dist/vue/normal/<basename>.js`（扩展名以 tsdown 实际输出为准）；根入口 `.` 仅导出类型/元数据或显式文档化为「全量慎用」，避免默认全图标打包。

**验收（按需导出）**：

- 在 **Vite**（`apps/sample`）与 **Bun 直连 Node 解析**（例如小型 `bun run` 脚本 `import()` 单个子路径）各做一次 smoke test，确认仅引用一个子路径时产物或解析链不拉取其余图标。

**完成标准**：`turbo run build`（或仓库约定 CI 构建）可通过；上述双路径 smoke test 通过。

### 5. 联调与依赖

- 在 `packages/icons/package.json` 中显式加入 **`svgo`**、**`tsdown`**、**`unplugin-vue`**（及 `@vue/compiler-sfc` 若 tsdown 未传递引入）等构建所需依赖；用途在实现 commit 消息或本计划首条 patch 中简述即可。
- 若根 `turbo.json` 需声明 `packages/icons#build` 依赖关系，一并调整。

**完成标准**：新克隆仓库执行 `bun install` 与 `build` 无需手工全局安装额外 CLI。

## 影响范围

- `packages/icons/scripts/`（`icon-naming.ts`、`rename-svg-icons.ts`、`format-svg.ts`、`gen-vue-icons.ts`、`build-vue-icons.ts`、`smoke-resolve-subpath.ts`）
- `packages/icons/src/vue/**`（由 `icons:gen` 生成）、`packages/icons/src/env.d.ts`、`packages/icons/tsconfig.json`、`packages/icons/tsconfig.icons-vue.json`
- `packages/icons/package.json`（exports、scripts、sideEffects、依赖）
- `packages/icons/src/svg/normal/sort-rigth.svg` → `sort-right.svg`（git mv）
- `packages/desktop/package.json`（`@ultra-ui/icons` workspace 依赖，便于 turbo 构建顺序）
- `apps/sample/package.json`、`apps/sample/src/icon/index.vue`（按需子路径与 `UIcon` 联调）
- `apps/icons-example/**`（独立图标预览：Vue + Vite，端口 7789）
- `playgrounds/icons/**`（workspace 图标预览）
- 根目录 `bun.lock`（依赖锁定）
- `packages/desktop/src/components/**`（图标导入自 `@ultra-ui/icons` 子路径）
- `apps/sample/vite.config.ts`、`apps/sample/**/*.vue`
- `AGENTS.md`、`migrate.md`
- `packages/icons/src/normal.ts`、`packages/icons/src/colorful.ts`、`packages/icons/scripts/gen-icon-barrels.ts`（icons:gen 生成/更新）

不包含 `.agent-context/`。

## 历史补丁

- patch-6: playgrounds/icons 预览卡片缩小、图标放大
- patch-1: 迁移 @ultra/icon → @ultra-ui/icons
- patch-2: 具名导出入口 `@ultra-ui/icons` / `@ultra-ui/icons/normal`（及 colorful）
- patch-3: tsdown 生成 dts（移除 vue-tsc）+ `apps/icons-example` Lucide 风格预览
- patch-4: format-svg 适配 SVGO 4.x（optimize 抛错、Output 仅含 data）
- patch-5: 生成 Vue 图标移除 `size` prop，根 svg 固定 1em + `gen` 跳过标记
