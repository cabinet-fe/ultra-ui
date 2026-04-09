# AGENTS.md — Ultra UI

Vue 3 组件库，完全 TypeScript 开发，BEM + CSS 变量主题系统。

## 常用命令

```bash
bun install                                  # 安装依赖
cd playgrounds/desktop && bun dev            # 启动开发预览 (端口 7788)
bun tools/cli/gen-component/index.ts         # 交互式生成新组件
bun tools/cli/export/index.ts               # 重新导出组件
cd tools/build && bun index.ts              # 构建产物到 dist/
cd tools/build && bun index.ts --release    # 构建 + 发版
bun vitest                                   # 运行测试
bun run lint                                 # oxlint
bun run format                               # oxfmt
bun run build                                # turbo run build（各包 build 拓扑）
```

## 技术栈

| 类别      | 技术                                       | 版本          |
| --------- | ------------------------------------------ | ------------- |
| 框架      | Vue 3 (Composition API + `<script setup>`) | ^3.5.32       |
| 语言      | TypeScript                                 | ^6.0          |
| 运行时    | Bun                                        | -             |
| 构建      | tsdown + Rolldown                          | -             |
| 样式      | SCSS + BEM + CSS 变量                      | sass-embedded |
| 测试      | Vitest                                     | ^4.1          |
| 格式化    | oxfmt + oxlint                             | -             |
| Monorepo  | Turborepo + workspaces                     | -             |
| Git Hooks | simple-git-hooks (commit-msg)              | -             |
| 核心依赖  | `@cat-kit/core`（日期/数值/定时器、树结构等数据结构）、`@cat-kit/be`（CLI/构建）、`@ultra-ui/icons`（图标） | peer / deps   |

## 目录结构

```
ultra-ui/
├── packages/
│   ├── utils/           # @ultra-ui/utils — 工具函数、共享类型、样式系统（→ AGENTS.md）
│   ├── compositions/    # @ultra-ui/compositions — Vue 组合式函数（→ AGENTS.md）
│   ├── directives/      # @ultra-ui/directives — Vue 自定义指令（→ AGENTS.md）
│   ├── desktop/         # @ultra-ui/desktop — 桌面端组件库主包（→ AGENTS.md）
│   ├── icons/           # @ultra-ui/icons — SVG 图标组件（→ AGENTS.md）
│   └── mobile/          # @ultra-ui/mobile — 移动端（占位，暂无内容）
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
@ultra-ui/utils ←── @ultra-ui/directives
    ↑                      ↑
@ultra-ui/compositions     │
    ↑                      │
    └──────────┬───────────┘
               ↓
        @ultra-ui/desktop ←── (peer) @ultra-ui/icons
               ↑
     playgrounds/desktop
```

## 路径别名

| 别名                    | 指向                       |
| ----------------------- | -------------------------- |
| `@ultra-ui/utils`       | `packages/utils/src`       |
| `@ultra-ui/desktop`     | `packages/desktop/src`     |
| `@ultra-ui/compositions`| `packages/compositions/src`|
| `@ultra-ui/directives`  | `packages/directives/src`  |

## 全局命名约定

| 对象     | 规则                         | 示例                              |
| -------- | ---------------------------- | --------------------------------- |
| 组件名   | `U` + PascalCase             | `UButton`、`USelect`              |
| CSS 类   | `u-` + BEM                   | `u-button`、`u-button__icon`      |
| 指令名   | `v` + camelCase              | `vRipple`、`vClickOutside`        |
| 目录名   | kebab-case                   | `date-picker`、`number-input`     |
| 类型命名 | `<Name>Props` / `<Name>Emits`| `ButtonProps`、`_ButtonExposed`（内部）、`ButtonExposed`（导出） |

## 约束

- Commit message 通过 `simple-git-hooks` + `cat-cli verify-commit` 校验。
- `sideEffects` 声明：组件 `style.ts`、指令样式、`styles/` 目录、`.css`、`.scss`。
- 使用`tsc`校验时不得输出任何文件，包括声明文件
