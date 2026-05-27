# AGENTS.md — Ultra UI

Vue 3 组件库，完全 TypeScript 开发，BEM + CSS 变量主题系统。

## 常用命令

> 工具链：[Vite+](https://viteplus.dev/)，本地需安装全局 `vp` CLI。

```bash
vp install                          # 安装依赖（自动检测 packageManager → bun）
cd playgrounds/desktop && vp dev    # 组件预览（端口 7788）
bun run build                       # 拓扑构建全部 packages → dist/
bun run build:packages              # 发布构建（CI 用，排除 @veltra/mobile）
bun run lint                        # Oxlint + 类型检查（lint.options.typeCheck）
bun run fmt                         # Oxfmt 格式化
bun run test                        # Vitest（根 vite.config.ts test 块）
vp changeset                        # 记录变更（见 RELEASE.md）
bun run release                     # dev 分支落版本并推送；CI 负责测试/构建/发布
```

按包构建/测试：

```bash
vp pack -F @veltra/desktop          # 单包 library 构建
vp test -F @veltra/utils            # 单包测试
vp run -F @veltra/icons build       # 单包脚本（如图标生成 + pack）
```

## 技术栈

| 类别 | 技术 | 版本 |
| ---- | ---- | ---- |
| 框架 | Vue 3（Composition API + `<script setup>`） | >=3.5.0（peer） |
| 语言 | TypeScript | ^6.0 |
| 运行时 | Bun | - |
| 工具链 | [Vite+](https://viteplus.dev/)（dev/build/test/lint/fmt/pack/run） | ^0.1 |
| 库打包 | 各包 `vite.config.ts` 的 `pack` 块 + `vp pack` | - |
| 样式 | SCSS + BEM + CSS 变量 | sass-embedded |
| 测试 | Vitest（`vp test`） | ^4.1 |
| 校验 | Oxlint + tsgolint + Oxfmt | - |
| Monorepo | `vp run` 任务编排，workspaces 拓扑由依赖图派生 | - |
| Git Hooks | simple-git-hooks（commit-msg + pre-commit → `vp staged`） | - |
| 核心 peer | `@cat-kit/core`、`@cat-kit/fe`（browser/neutral）；`@veltra/icons` | 宿主安装 |

## 目录结构

```
ultra-ui/
├── packages/
│   ├── utils/           # @veltra/utils — 工具函数、共享类型
│   ├── styles/          # @veltra/styles — 共享 SCSS 与主题（@veltra/styles/theme）
│   ├── compositions/    # @veltra/compositions — Vue 组合式函数
│   ├── directives/      # @veltra/directives — Vue 自定义指令
│   ├── desktop/         # @veltra/desktop — 桌面端组件库主包
│   ├── icons/           # @veltra/icons — SVG 图标组件
│   ├── vite/            # @veltra/vite — Vite 辅助（组件 resolver）
│   └── mobile/          # @veltra/mobile — 移动端（占位）
├── playgrounds/
│   ├── desktop/         # 组件开发预览（→ AGENTS.md）
│   └── icons/           # 图标预览
├── vite.config.ts       # monorepo 级 test/lint/fmt/run/staged
├── package.json         # workspaces: packages/*, playgrounds/*
└── tsconfig.json        # Solution 风格 project references
```

各子包 AGENTS.md 记录包内规范与 API，见下方索引。

| 包 | AGENTS.md |
| -- | --------- |
| `@veltra/utils` | `packages/utils/AGENTS.md` |
| `@veltra/styles` | `packages/styles/AGENTS.md` |
| `@veltra/compositions` | `packages/compositions/AGENTS.md` |
| `@veltra/directives` | `packages/directives/AGENTS.md` |
| `@veltra/desktop` | `packages/desktop/AGENTS.md` |
| `@veltra/icons` | `packages/icons/AGENTS.md` |
| `@veltra/vite` | `packages/vite/AGENTS.md` |
| 预览应用 | `playgrounds/desktop/AGENTS.md` |

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
               ↑
     playgrounds/desktop
```

`@veltra/styles`（SCSS + `@veltra/styles/theme`）被 desktop、directives、playgrounds 等使用。**`theme` 运行时依赖 `@veltra/compositions`（`useConfig`），compositions 不得再导出 theme，避免循环依赖。** Sass 使用 `pkg:@veltra/styles/...`，构建与预览需 `NodePackageImporter`（见 `packages/styles/AGENTS.md`）。

browser/neutral 的 `@cat-kit/*` 与 `@veltra/*` 在 library 包中声明为 **peerDependencies**（`>=` 下限版本）；宿主或 playground 在 dependencies 中安装实际版本。

## 路径别名

| 别名 | 指向 |
| ---- | ---- |
| `@veltra/utils` | `packages/utils/src` |
| `@veltra/styles` | `packages/styles/src` |
| `@veltra/desktop` | `packages/desktop/src` |
| `@veltra/compositions` | `packages/compositions/src` |
| `@veltra/directives` | `packages/directives/src` |

## 全局命名约定

| 对象 | 规则 | 示例 |
| ---- | ---- | ---- |
| 组件名 | `U` + PascalCase | `UButton`、`USelect` |
| CSS 类 | `u-` + BEM | `u-button`、`u-button__icon` |
| 指令名 | `v` + camelCase | `vRipple`、`vClickOutside` |
| 目录名 | kebab-case | `date-picker`、`number-input` |
| 类型命名 | `<Name>Props` / `<Name>Emits` | `ButtonProps`、`_ButtonExposed`（内部）、`ButtonExposed`（导出） |

## 新增组件（手动）

在 `packages/desktop/src/components/<name>/` 创建：

- `<name>.vue`、`index.ts`（导出 `U<PascalName>`）、`style.scss`、`style.ts`
- 类型放在 `packages/desktop/src/types/<name>.ts`
- 在 `components/index.ts` 与 `types/index.ts` 中补充导出
- 可选：在 `playgrounds/desktop/src/<name>/index.vue` 添加演示页

## 约束

- Commit message 经 `simple-git-hooks` + `cat-cli verify-commit` 校验。
- `sideEffects`：组件 `style.ts`、指令样式、`@veltra/styles` 的 `.scss` 与副作用 TS 入口、`.css`、`.scss`。
- TypeScript 6.x，各包 tsconfig 基于 `@cat-kit/tsconfig`；禁止跳过类型错误。
- 各 `@veltra/*` 库自带 `vite.config.ts`（含 `pack` 块）；根 `vite.config.ts` 仅 monorepo 级配置。
- 不得用 `@ts-ignore`、`skipLibCheck` 等方式绕过类型错误。
- pre-commit 会执行 `vp staged`（lint --fix + fmt），提交前本地应先过 `bun run lint`。


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
- 组件演示。当代理运行浏览器自动化相关能力时需要去 `playgrounds/*` 运行 `vp dev` 命令，很多时候用户会提前运行这些命令，先检查定义的端口进程是否存在，如果不存在再运行。
- 更新 `skills/veltra-ui` 内容。改动设计各个包的 API 变更时（例如组件的属性变更、组件的新增删除、utils 的新增删除、包增加导出内容、包版本更新等等）需要更新该目录中的技能，同时要引用 `skill-standard.md` 中的指令，如果有编写技能相关的 SKILL(write-skills 等等),尝试使用相关技能编写。
