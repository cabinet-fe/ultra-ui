# 版本发布与收尾

> 状态: 已执行

## 目标

将所有子包版本统一为 1.0.0，更新项目文档、CLI 工具和测试配置适配新结构，编写迁移指南，完成超级重构的最终验证。

前置条件：Plan-4 和 Plan-5 全部完成且验证通过。

## 内容

### 1. 版本号确认

确认 4 个子包 package.json 版本均为 1.0.0（Plan-4 步骤 2 中已设置）。

检查 dist 产物中的 package.json：workspace:* 依赖是否已被替换为 `^1.0.0`。若未自动替换，在 build 的 post-build 步骤中添加处理逻辑（使用 @cat-kit/maintenance 的 syncDependencies API）。

完成标准：所有源码和构建产物的版本号一致。

### 2. 更新 AGENTS.md

按以下章节逐项更新：

**常用命令**：
- `cd sample && bun dev` 保持不变
- `cd build && bun index.ts` 保持不变
- `bun cli/gen-component/index.ts` 保持不变
- `bun cli/export/index.ts` 保持不变

**技术栈表**：
| 变更项 | 旧值 | 新值 |
|--------|------|------|
| 构建 | tsdown + Rolldown | @cat-kit/maintenance（或保留 tsdown，视 Plan-5 决策） |
| 核心依赖 | cat-kit, @ultra/icon (peer) | @cat-kit/core (peer in core), lucide-vue-next (dep in pc) |

**目录结构**：替换为：
```
ultra-ui/
├── build/                     # 构建脚本
├── cli/                       # CLI 工具
├── sample/                    # 开发预览应用
├── packages/
│   ├── core/                  # @ultra-ui/core (utils, compositions, shared, types)
│   ├── styles/                # @ultra-ui/styles (SCSS, 主题系统)
│   ├── pc/                    # @ultra-ui/pc (71 个 PC 端组件)
│   └── directives/            # @ultra-ui/directives (指令)
├── package.json               # Monorepo 根
├── tsconfig.json
└── vitest.config.ts
```

**组件开发规范**：
- 文件结构中的路径前缀从 `ui/components/<name>/` 改为 `packages/pc/src/components/<name>/`
- 类型定义位置从 `ui/types/components/<name>.ts` 改为 `packages/pc/src/types/<name>.ts`
- 组件编写模式中的导入示例更新：
  - `import { bem } from '@ui/utils'` → `import { bem } from '@ultra-ui/core'`
  - `import type { XxxProps } from '@ui/types'` → `import type { XxxProps } from '../types/xxx'`（包内相对路径）

**样式系统**：
- SCSS 引用方式更新：`@use '../../styles/mixins'` → `@use 'mixins'`（通过 loadPaths 解析）
- 说明 loadPaths 配置要求

**路径别名**：
| 别名 | 指向 |
|------|------|
| `@ultra-ui/core` | `packages/core/src/`（tsconfig paths + vite alias） |
| `@ultra-ui/styles` | `packages/styles/src/` |
| `@ultra-ui/pc` | `packages/pc/src/` |
| `@ultra-ui/directives` | `packages/directives/src/` |

**约束**：
- sideEffects 声明更新为各包独立配置
- 移除 `@ui/*` 别名的说明

完成标准：AGENTS.md 每个章节与实际项目结构一致。

### 3. 更新 CLI 工具

**cli/gen-component/**：
- `render-file.ts`：组件目录从 `ui/components/` → `packages/pc/src/components/`
- `render-file.ts`：类型目录从 `ui/types/components/` → `packages/pc/src/types/`
- `render-file.ts`：模板中的导入路径从 `@ui/utils` → `@ultra-ui/core`，`@ui/types` → 包内相对路径
- `render-file.ts`：`cat-kit/be` 的 `camelCase` → `@cat-kit/core` 的 `str(x).camelCase('upper')`（已在 Plan-4 步骤 6 替换导入，此处验证模板生成的代码是否正确）

**cli/export/**：
- `index.ts`：扫描路径从 `ui/components/` → `packages/pc/src/components/`
- `index.ts`：输出的入口文件路径适配新结构
- `index.ts`：`cat-kit/be` 的 `readDir` → `@cat-kit/be` 的 `readDirRecursive`（已在 Plan-4 替换）

**cli/rename/**：
- `types.ts`：扫描路径从 `ui/types/components/` → `packages/pc/src/types/`
- `types.ts`：`cat-kit/be` 的 `readDir` → `@cat-kit/be` 的 `readDirRecursive`（已在 Plan-4 替换）

完成标准：`bun cli/gen-component/index.ts` 和 `bun cli/export/index.ts` 命令正常工作。

### 4. 更新 vitest 配置

更新 vitest.config.ts 的以下配置项：

**resolve.alias**：
```typescript
alias: {
  '@ultra-ui/core': resolve(__dirname, 'packages/core/src'),
  '@ultra-ui/styles': resolve(__dirname, 'packages/styles/src'),
  '@ultra-ui/pc': resolve(__dirname, 'packages/pc/src'),
  '@ultra-ui/directives': resolve(__dirname, 'packages/directives/src'),
}
```

**test.include**：
```typescript
include: ['packages/pc/src/components/**/__test__/**/*.test.ts']
```

**css.preprocessorOptions.scss.loadPaths**：
```typescript
loadPaths: [resolve(__dirname, 'packages/styles/src')]
```

完成标准：`bun vitest` 发现并运行 packages/pc/src/components/expression-editor/__test__/ 下的测试。

### 5. 更新根 package.json scripts

| 旧 script | 新 script |
|-----------|-----------|
| `"gen": "bun cli/gen-component/index.ts"` | 保持不变 |
| `"export": "bun cli/export/index.ts"` | 保持不变 |
| `"rename:types": "bun cli/rename/types"` | 保持不变 |

检查所有 script 路径是否仍然有效。

完成标准：所有 npm scripts 可正常执行。

### 6. 配置 .npmrc

为 @ultra-ui scope 配置私有 registry：
```
@ultra-ui:registry=http://192.168.31.250:6005
```

确认现有 .npmrc 内容是否需要更新。

完成标准：`npm config get @ultra-ui:registry` 返回正确地址。

### 7. 编写 MIGRATION.md

编写 0.4.x → 1.0.0 迁移指南，内容包括：

**包名变更**：
| 旧包名 | 新包名 |
|--------|--------|
| ultra-ui | @ultra-ui/pc（组件）+ @ultra-ui/core（工具）+ @ultra-ui/styles（样式）+ @ultra-ui/directives（指令） |

**导入路径变更**：
```typescript
// 旧
import { UButton } from 'ultra-ui'
import 'ultra-ui/styles'
// 新
import { UButton } from '@ultra-ui/pc'
import '@ultra-ui/styles'
```

**依赖变更**：
- 移除：ultra-ui, cat-kit, @ultra/icon
- 新增：@ultra-ui/pc, @ultra-ui/core, @ultra-ui/styles, @ultra-ui/directives

**图标变更**：@ultra/icon 图标名 → lucide-vue-next 图标名的映射（复用 Plan-4 步骤 7 的映射表）

完成标准：迁移指南覆盖所有 breaking changes。

### 8. 全量验证清单

| # | 验证项 | 验证方式 |
|---|--------|---------|
| 1 | 依赖安装 | `bun install` 退出码 0 |
| 2 | TypeScript 编译 | 各子包 `tsc --noEmit` 无错误 |
| 3 | 开发服务器 | `cd sample && bun dev` 正常启动，组件渲染正确 |
| 4 | 生产构建 | `cd build && bun index.ts` 成功 |
| 5 | 测试 | `bun vitest` 通过 |
| 6 | CLI-gen | `bun cli/gen-component/index.ts` 生成文件路径正确 |
| 7 | CLI-export | `bun cli/export/index.ts` 输出正确 |
| 8 | 残留检查-@ui | `rg '@ui/' packages/ cli/ sample/` 无结果 |
| 9 | 残留检查-cat-kit | `rg "from 'cat-kit" packages/ cli/ sample/` 无结果（排除 @cat-kit） |
| 10 | 残留检查-icon | `rg '@ultra/icon' packages/` 无结果 |
| 11 | 残留检查-builder | `rg '@builder/vite' sample/` 无结果 |
| 12 | AGENTS.md 准确性 | 人工比对文档与实际结构 |
| 13 | MIGRATION.md 完整性 | 覆盖所有 breaking changes |

完成标准：13 项全部通过。

## 影响范围

- `AGENTS.md`
- `MIGRATION.md`
- `.npmrc`
- `vitest.config.ts`
- `build/prepare.ts`
- `build/index.ts`
- `cli/export/index.ts`
- `cli/rename/types.ts`
- `cli/gen-component/render-file.ts`
- `packages/pc/src/types/theme.ts`
- `sample/vite.config.ts`

## 历史补丁

- patch-1: review 后修正 dist 内 package.json 路径与 AGENTS 核心依赖表述
