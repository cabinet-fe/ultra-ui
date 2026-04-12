# AGENTS.md — Ultra UI

Vue 3 组件库，完全 TypeScript 开发，BEM + CSS 变量主题系统。

## 常用命令

```bash
bun install                                  # 安装依赖
cd playgrounds/desktop && bun dev            # 启动开发预览 (端口 7788)
bun tools/cli/gen-component/index.ts         # 交互式生成新组件
bun tools/cli/export/index.ts               # 重新导出组件
bun run build                               # turbo run build（各包 tsdown 拓扑 → dist/）
bun run check-types                         # turbo run check-types
bun run test                                # turbo run test（playground 调根目录 scripts/vitest-run.ts 跑 vitest）
bun run changeset                           # 记录变更（见 RELEASE.md：Version PR 仅 bump；推送 v*.*.* tag 后 CI 发布）
bun run lint                                 # oxlint
bun run format                               # oxfmt
```

## 技术栈

| 类别      | 技术                                                                                                        | 版本          |
| --------- | ----------------------------------------------------------------------------------------------------------- | ------------- |
| 框架      | Vue 3 (Composition API + `<script setup>`)                                                                  | ^3.5.32       |
| 语言      | TypeScript                                                                                                  | ^6.0          |
| 运行时    | Bun                                                                                                         | -             |
| 构建      | tsdown + Rolldown                                                                                           | -             |
| 样式      | SCSS + BEM + CSS 变量                                                                                       | sass-embedded |
| 测试      | Vitest                                                                                                      | ^4.1          |
| 格式化    | oxfmt + oxlint                                                                                              | -             |
| Monorepo  | Turborepo + workspaces                                                                                      | -             |
| Git Hooks | simple-git-hooks (commit-msg)                                                                               | -             |
| 核心依赖  | `@cat-kit/core`（日期/数值/定时器、树结构等数据结构）、`@cat-kit/be`（CLI/构建）、`@veltra/icons`（图标） | peer / deps   |

## 目录结构

```
ultra-ui/
├── packages/
│   ├── utils/           # @veltra/utils — 工具函数、共享类型（→ AGENTS.md）
│   ├── styles/          # @veltra/styles — 共享 SCSS 与主题 TS（`@veltra/styles/theme`）（→ AGENTS.md）
│   ├── compositions/    # @veltra/compositions — Vue 组合式函数（→ AGENTS.md）
│   ├── directives/      # @veltra/directives — Vue 自定义指令（→ AGENTS.md）
│   ├── desktop/         # @veltra/desktop — 桌面端组件库主包（→ AGENTS.md）
│   ├── icons/           # @veltra/icons — SVG 图标组件（→ AGENTS.md）
│   └── mobile/          # @veltra/mobile — 移动端（占位，暂无内容）
├── tools/
│   ├── build/           # 构建流水线（→ AGENTS.md）
│   └── cli/             # 开发辅助 CLI 工具（→ AGENTS.md）
├── playgrounds/
│   └── desktop/         # 组件开发预览应用（→ AGENTS.md）
├── package.json         # Monorepo 根 (workspaces: packages/*, playgrounds/*, tools/*)
├── tsconfig.json        # Solution 风格，仅 project references
└── vitest.config.ts
```

> 每个子包含独立 `AGENTS.md`，记录包内专属规范和 API。上方 `→ AGENTS.md` 标记了入口。

## 包依赖关系

```
@cat-kit/core
    ↑
@veltra/utils ←── @veltra/directives
    ↑                      ↑
@veltra/compositions     │
    ↑                      │
    └──────────┬───────────┘
               ↓
        @veltra/desktop ←── (peer) @veltra/icons
               ↑
     playgrounds/desktop
```

`@veltra/styles`（共享 SCSS + `@veltra/styles/theme`）被 `desktop`、`directives`、`playgrounds/desktop` 等依赖；**`theme` 子路径在运行时依赖 `@veltra/compositions`（`useConfig`），`compositions` 不得再导出 `theme`，以免包循环。** Sass 使用 `pkg:@veltra/styles/...`，构建与预览需配置 `NodePackageImporter`（见 `packages/styles/AGENTS.md`）。

## 路径别名

| 别名                     | 指向                        |
| ------------------------ | --------------------------- |
| `@veltra/utils`        | `packages/utils/src`        |
| `@veltra/styles`       | `packages/styles/src`       |
| `@veltra/desktop`      | `packages/desktop/src`      |
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

## 约束

- Commit message 通过 `simple-git-hooks` + `cat-cli verify-commit` 校验。
- `sideEffects` 声明：组件 `style.ts`、指令样式、`@veltra/styles` 的 `.scss` 与副作用 TS 入口、`.css`、`.scss`。
- 使用`tsc`校验时不得输出任何文件，包括声明文件。
- 本项目基于 typescript 6.x 版本，并且全部包的 tsconfig.json 配置都基于 `@cat-kit/tsconfig`, 不得使用任何方式跳过或者避免类型错误。
