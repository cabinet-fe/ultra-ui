<!-- DEV_PROMPTS:START -->

# DevPrompts Instructions

本说明为在当前项目中工作的 AI 助手 提供指导。

## 目标优先级

**始终**按此顺序决策：

正确性 → 安全性 → 可维护性 → 可读性 → 性能 → 简洁性

## 通用开发规范

- **命名规范**：使用具有描述性的变量和函数名。
- **模块化**：遵循 SOLID 原则，确保函数职责单一，避免“上帝类”或超长函数。
- **注释艺术**：不要解释代码“在做什么”，而要解释“为什么这样做”以及任何非显而易见的逻辑。
- **自解释**：代码本身应清晰易读，尽量减少对文档的依赖。
- **避免死代码**：不得包含任何未使用或者不会被执行到的代码。

## 特定语言规范

- [TypeScript](dev-prompts/languages/typescript.md)

## 技术栈

- **包管理器**：bun

## 项目结构

编写新功能或者进行更改时**按需参考**下面的项目结构，以便复用已有的代码，例如工具，颜色混入等：

- `ui/`：核心组件库源码
  - `components/`：组件实现（`.vue`/`.ts`/`.scss`）
  - `types/`：组件与通用类型定义（`components/*.ts`、`component-common.ts`）
  - `compositions/`：组合式能力与跨组件逻辑（如 `use-model`、`use-transition`）
  - `directives/`：指令实现与样式（如 `ripple`、`click-outside`）
  - `styles/`：主题、变量、混入、全局样式与动画
  - `utils/`：DOM/表单/响应式等工具函数
  - `shared/`：库内共享常量与入口聚合
  - `index.ts`：组件库入口导出
  - `install.ts`：插件安装与全局注册
  - `package.json`、`tsconfig.json`：库内构建配置


## 代码审查

**每次**代码生成都要经过必要的审查，以符合上述规范。


<!-- DEV_PROMPTS:END -->