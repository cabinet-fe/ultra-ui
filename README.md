<div align="center">
  <h1>Ultra UI</h1>
  <p>🚀 给你带来极致性能、极致代码、极致体验的 Vue3 组件库</p>
  <p>
    <a href="https://cabinet-fe.github.io/ultra-ui-doc/">📖 查看文档</a>
  </p>
</div>

---

## ✨ 特性

- 🎯 **极致性能** - 精心优化，确保每个组件都能提供卓越性能
- 💎 **TypeScript** - 完全使用 TypeScript 开发，提供完整的类型定义
- 🎨 **60+ 组件** - 丰富的组件库，覆盖常见业务场景
- 📦 **按需引入** - 支持 Tree Shaking，减小打包体积
- 🛠️ **开发友好** - 清晰的代码结构，易于维护和扩展
- 🌈 **现代化** - 基于 Vue 3.5+ 最新特性开发

## 📦 安装

使用 bun（推荐）：

```bash
bun add ultra-ui
```

使用 npm：

```bash
npm install ultra-ui
```

使用 yarn：

```bash
yarn add ultra-ui
```

使用 pnpm：

```bash
pnpm add ultra-ui
```

## 🚀 快速开始

### 完整引入

```ts
import { createApp } from 'vue'
import { UltraUI } from 'ultra-ui/install'
import 'ultra-ui/styles'
import App from './App.vue'

const app = createApp(App)
app.use(UltraUI)
app.mount('#app')
```

### 按需引入

```vue
<template>
  <u-button type="primary" @click="handleClick">点击我</u-button>
  <u-input v-model="value" placeholder="请输入内容" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UInput } from 'ultra-ui'
import 'ultra-ui/styles'

const value = ref('')
const handleClick = () => {
  console.log('Button clicked!', value.value)
}
</script>
```

## 🔨 开发指南

### 环境准备

- Node.js 18+
- Bun 1.0+

### 克隆项目

```bash
git clone https://github.com/cabinet-fe/ultra-ui.git
cd ultra-ui
```

### 安装依赖

```bash
bun install
```

### 启动开发服务器

```bash
cd sample
bun run dev
```

### 构建组件库

```bash
cd build
bun run build
```

### 生成新组件

```bash
bun run gen
```

## 📁 项目结构

```
ultra-ui/
├── ui/                # 组件源代码
│   ├── components/   # 所有组件
│   ├── compositions/ # 组合式函数
│   ├── directives/   # 自定义指令
│   ├── styles/       # 样式文件
│   ├── types/        # TypeScript 类型定义
│   └── utils/        # 工具函数
├── sample/           # 组件示例和演示
├── build/            # 构建脚本
├── cli/              # 命令行工具
└── dist/             # 构建输出目录
```

## 💻 脚本命令

- `bun run gen` - 生成新组件
- `bun run export` - 导出组件
- `bun run rename:types` - 重命名类型
- `bun update` - 更新依赖

## 🛠️ 技术栈

- **Vue 3.5** - 渐进式 JavaScript 框架
- **TypeScript 5.9** - JavaScript 的超集
- **Vite (Rolldown)** - 下一代前端构建工具
- **SCSS** - CSS 预处理器
- **Vitest** - 单元测试框架
- **Bun** - 快速的 JavaScript 运行时

## 📝 代码规范

### 1. 减少代码嵌套

```ts
// ❌ 不好的做法
if (!disabled) {
  console.log('执行逻辑')
}

// ✅ 好的做法
if (disabled) return
console.log('执行逻辑')
```

### 2. 保持函数简短

函数的代码行数不应该超过 50 行，复杂逻辑应拆分为多个小函数。

### 3. 规范命名

命名务必规范清晰，可以使用 AI 工具辅助命名。

### 4. 完整的类型注解

为了类型系统的性能，请务必完整地注解函数和方法的参数类型和返回值类型：

```ts
// ❌ 依赖类型推断
function sum(n1: number, n2: number) {
  return n1 + n2
}

// ✅ 显式类型注解
function sum(n1: number, n2: number): number {
  return n1 + n2
}
```

### 5. 合并函数参数

如果参数超过 3 个，应合并为一个对象参数：

```ts
// ❌ 参数过多
function createUser(name: string, age: number, email: string, phone: string) {
  // ...
}

// ✅ 使用对象参数
function createUser(params: { name: string; age: number; email: string; phone: string }): User {
  // ...
}
```

## 🤝 贡献

欢迎贡献代码！请阅读我们的贡献指南，了解如何参与项目开发。

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 许可证

本项目采用 [MIT](./LICENSE) 许可证。

Copyright (c) PRESENT 前端小分队

## 🔗 相关链接

- [在线文档](https://cabinet-fe.github.io/ultra-ui-doc/)
- [GitHub 仓库](https://github.com/cabinet-fe/ultra-ui)
- [问题反馈](https://github.com/cabinet-fe/ultra-ui/issues)

---

<div align="center">
  <sub>Built with ❤️ by 前端小分队</sub>
</div>
