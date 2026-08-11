# AGENTS.md — Ultra UI

Vue 3 组件库，完全 TypeScript 开发，BEM + CSS 变量主题系统。

## 常用命令

> 工具链：[Vite+](https://viteplus.dev/)，本地需安装全局 `vp` CLI。

```bash
vp install                          # 安装依赖（自动检测 packageManager → bun）
cd playground && vp dev    # 组件预览（端口 7788）
bun run build                       # 拓扑构建全部 packages → dist/
bun run build:packages              # 发布构建（CI 用，排除 @veltra/mobile）
bun run lint                        # Oxlint + 类型检查（lint.options.typeCheck）
bun run fmt                         # Oxfmt 格式化
bun run test                        # Vitest（根 vite.config.ts test 块）
bun run skill:gen                   # 生成 skills/veltra-ui/generated 索引与各组件 types.d.ts、api.md
bun run resolver:gen                # 生成 @veltra/vite 组件表（desktop/ai/sheet 增删组件后必须运行）
vp changeset                        # 记录变更（见 RELEASE.md）
bun run release                     # dev 分支落版本并推送；CI 负责测试/构建/发布
```

按包构建/测试：

```bash
vp run -F @veltra/desktop build     # 单包 library 构建（vp pack 无包过滤器，等价于进包目录执行 vp pack）
cd packages/utils && vp test        # 单包测试（vp test 无包过滤器）
vp run -F @veltra/icons build       # 单包脚本（如图标生成 + pack）
```

## 本地 Git 配置

仓库路径**区分大小写**，与 Linux CI 一致。macOS / Windows 默认 `core.ignorecase=true`，clone 后需关闭：

```bash
git config --local core.ignorecase false
```

`vp install` / `bun install` 的 `postinstall` 会自动执行 `scripts/setup-git.ts` 写入上述配置；也可手动运行 `bun run scripts/setup-git.ts` 校验。

## 技术栈

| 类别      | 技术                                                               | 版本            |
| --------- | ------------------------------------------------------------------ | --------------- |
| 框架      | Vue 3（Composition API + `<script setup>`）                        | >=3.5.0（peer） |
| 语言      | TypeScript                                                         | ^6.0            |
| 运行时    | Bun                                                                | -               |
| 工具链    | [Vite+](https://viteplus.dev/)（dev/build/test/lint/fmt/pack/run） | ^0.1            |
| 库打包    | 各包 `vite.config.ts` 的 `pack` 块 + `vp pack`                     | -               |
| 样式      | SCSS + BEM + CSS 变量                                              | sass-embedded   |
| 测试      | Vitest（`vp test`）                                                | ^4.1            |
| 校验      | Oxlint + tsgolint + Oxfmt                                          | -               |
| Monorepo  | `vp run` 任务编排，workspaces 拓扑由依赖图派生                     | -               |
| Git Hooks | simple-git-hooks（commit-msg + pre-commit → `vp staged`）          | -               |
| 核心 peer | `@cat-kit/core`、`@cat-kit/fe`（browser/neutral）；`@veltra/icons` | 宿主安装        |

## 目录结构

```
ultra-ui/
├── packages/
│   ├── utils/           # @veltra/utils — 工具函数、共享类型
│   ├── styles/          # @veltra/styles — 共享 SCSS 与主题（@veltra/styles/theme）
│   ├── compositions/    # @veltra/compositions — Vue 组合式函数
│   ├── directives/      # @veltra/directives — Vue 自定义指令
│   ├── desktop/         # @veltra/desktop — 桌面端组件库主包
│   ├── sheet-core/      # @veltra/sheet-core — 表格核心（数据模型/公式/IO + VTable 适配层，框架无关）
│   ├── sheet/           # @veltra/sheet — 电子表格 Vue 编辑器（USheet，基于 sheet-core）
│   ├── ai/              # @veltra/ai — AI 能力包（对话组件 + 编排 + 可插拔 transport）
│   ├── icons/           # @veltra/icons — SVG 图标组件
│   ├── vite/            # @veltra/vite — Vite 辅助（组件 resolver）
│   └── mobile/          # @veltra/mobile — 移动端（占位）
├── playground/          # 统一预览（Desktop 组件 + Icons）
│   ├── AGENTS.md
│   ├── nav-config.ts
│   └── src/
├── vite.config.ts       # monorepo 级 test/lint/fmt/run/staged
├── package.json         # workspaces: packages/*, playground
└── tsconfig.json        # Solution 风格 project references
```

各子包 AGENTS.md 记录包内规范与 API，见下方索引。

| 包                     | AGENTS.md                         |
| ---------------------- | --------------------------------- |
| `@veltra/utils`        | `packages/utils/AGENTS.md`        |
| `@veltra/styles`       | `packages/styles/AGENTS.md`       |
| `@veltra/compositions` | `packages/compositions/AGENTS.md` |
| `@veltra/directives`   | `packages/directives/AGENTS.md`   |
| `@veltra/desktop`      | `packages/desktop/AGENTS.md`      |
| `@veltra/sheet-core`   | `packages/sheet-core/AGENTS.md`   |
| `@veltra/sheet`        | `packages/sheet/AGENTS.md`        |
| `@veltra/ai`           | `packages/ai/AGENTS.md`           |
| `@veltra/icons`        | `packages/icons/AGENTS.md`        |
| `@veltra/vite`         | `packages/vite/AGENTS.md`         |
| 预览应用               | `playground/AGENTS.md`            |

## 包依赖关系

```
@cat-kit/core
    ↑
@veltra/utils ←── @veltra/directives
    ↑                      ↑
@veltra/compositions       │
    ↑                      │
    └──────────┬───────────┘
               ↓
        @veltra/desktop ←── (peer) @veltra/icons
               ↑  ↑   ↑
               │  │   └── (peer) @veltra/sheet-core ←── (peer) @veltra/sheet（Vue 编辑器；peer: sheet-core/desktop/icons/styles/utils/compositions、@cat-kit/*、vue；deps: hucre）
               │  │            （deps: @visactor/vtable(-editors)、hucre；file-viewer 的 Excel 预览也走它）
               │  └── @veltra/ai（peer: desktop/icons/compositions/utils/styles）
               ↓
     playground ←── @veltra/sheet
```

`@veltra/styles`（SCSS + `@veltra/styles/theme`）被 desktop、directives、playground 等使用。**`theme` 运行时依赖 `@veltra/compositions`（`useConfig`），compositions 不得再导出 theme，避免循环依赖。** Sass 使用 `pkg:@veltra/styles/...`，构建与预览需 `NodePackageImporter`（见 `packages/styles/AGENTS.md`）。

browser/neutral 的 `@cat-kit/*` 在 library 包中声明为 **peerDependencies**（`>=` 下限版本）；内部 `@veltra/*` peer 一律 `workspace:^`（发布时替换为 `^` 范围）；宿主或 playground 在 dependencies 中安装实际版本。

版本策略（`.changeset/config.json`）：fixed 分两组同版本发布——核心组 `utils/styles/compositions/directives/desktop`、表格组 `sheet/sheet-core`；`ai`/`icons`/`vite` 独立版本线。`___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH.onlyUpdatePeerDependentsWhenOutOfRange` 已开启：范围内升级不连锁。**不要把内部 peer 改回 `workspace:*`**（发布为精确版本，跨组 minor 会触发 changesets 连锁 major 雪球）。

## 路径别名

| 别名                   | 指向                        |
| ---------------------- | --------------------------- |
| `@veltra/utils`        | `packages/utils/src`        |
| `@veltra/styles`       | `packages/styles/src`       |
| `@veltra/desktop`      | `packages/desktop/src`      |
| `@veltra/sheet-core`   | `packages/sheet-core/src`   |
| `@veltra/sheet`        | `packages/sheet/src`        |
| `@veltra/ai`           | `packages/ai/src`           |
| `@veltra/compositions` | `packages/compositions/src` |
| `@veltra/directives`   | `packages/directives/src`   |

## 全局命名约定

| 对象     | 规则                          | 示例                                                             |
| -------- | ----------------------------- | ---------------------------------------------------------------- |
| 组件名   | `U` + PascalCase              | `UButton`、`USelect`                                             |
| CSS 类   | `u-` + BEM                    | `u-button`、`u-button__icon`                                     |
| 指令名   | `v` + camelCase               | `vRipple`、`vClickOutside`                                       |
| 目录名   | kebab-case                    | `date-picker`、`number-input`                                    |
| 类型命名 | `<Name>Props` / `<Name>Emits` | `ButtonProps`、`_ButtonExposed`（内部）、`ButtonExposed`（导出） |

## 新增组件（手动）

在 `packages/desktop/src/components/<name>/` 创建：

- `<name>.vue`、`index.ts`（导出 `U<PascalName>`）、`style.scss`、`style.ts`
- 类型放在 `packages/desktop/src/types/<name>.ts`
- 在 `components/index.ts` 与 `types/index.ts` 中补充导出
- 可选：在 `playground/src/<name>/index.vue` 添加演示页

## 约束

- Commit message 经 `simple-git-hooks` + `cat-cli verify-commit` 校验。
- `sideEffects`：组件 `style.ts`、指令样式、`@veltra/styles` 的 `.scss` 与副作用 TS 入口、`.css`、`.scss`。
- TypeScript 6.x，各包 tsconfig 基于 `@cat-kit/tsconfig`；禁止跳过类型错误。
- 各 `@veltra/*` 库自带 `vite.config.ts`（含 `pack` 块）；根 `vite.config.ts` 仅 monorepo 级配置。
- 不得用 `@ts-ignore`、`skipLibCheck` 等方式绕过类型错误。
- pre-commit 会执行 `vp staged`（lint --fix + fmt），提交前本地应先过 `bun run lint`。
- 不得添加 `// eslint-disable-next-line` 之类的命令用于跳过 lint 错误检查

## 编码后操作

### 1. 代码验证

完成代码修改后，**必须**运行验证，确认无类型/lint 错误、构建失败与测试失败后再宣称完成。

在仓库根目录依次执行：

```bash
bun run lint      # 该命令包含所有的类型检查 和 lint；
bun run test      # Vitest 全量测试；Vitest 缓存下未改动的包通常很快跳过
bun run build     # 全量拓扑构建；任一 @veltra/* 包编译失败即未通过
```

### 2. 可选追加（视改动内容）

- 更新当前文件。如果有重要目录、命令的变更、技术栈和依赖的添加删除，需要更新当前文件。
- 组件演示。当代理运行浏览器自动化相关能力时需要去 `playground` 运行 `vp dev` 命令，很多时候用户会提前运行这些命令，先检查定义的端口进程是否存在，如果不存在再运行。
- 更新 `skills/veltra-ui` 内容。改动涉及各个包的 API 变更时（例如组件的属性变更、组件的新增删除、utils 的新增删除、包增加导出内容、包版本更新等等）需要更新该目录中的技能。

### 提交和发版

### 提交

每次提交前根据当前更改内容自行决定是否运行 `bun run changeset`, 注意，你可以指定 `-m <text>` 参数来直接提供变更信息。

### 发版

如果提及发版，请参考 `release.md` 文件

## Agent skills

### Issue tracker

Issues 均作为本地 Markdown 文件存放在 `.scratch/<feature-slug>/` 目录下。参见 `docs/agents/issue-tracker.md`。

### Domain docs

多 Context 架构，通过根目录 `CONTEXT-MAP.md` 索引。参见 `docs/agents/domain.md`。
