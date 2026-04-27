# @cat-kit/tsconfig

共享 TypeScript 配置文件预设，提供 Node.js、浏览器、Bun、Vue 等不同环境的 tsconfig 继承方案。

## 预设列表

| 预设 | 适用环境 | 说明 |
|------|----------|------|
| `tsconfig.json` | 通用 | 基础配置，通常不直接使用 |
| `tsconfig.node.json` | Node.js | Node.js 项目配置 |
| `tsconfig.web.json` | 浏览器 | 浏览器/前端项目配置 |
| `tsconfig.bun.json` | Bun | Bun 运行时配置 |
| `tsconfig.vue.json` | Vue | Vue 项目配置 |

## 使用方式

在项目的 `tsconfig.json` 中通过 `extends` 继承：

```json
{
  "extends": "@cat-kit/tsconfig/tsconfig.node.json",
  "compilerOptions": { "rootDir": "./src", "outDir": "./dist" },
  "include": ["src"]
}
```

## 预设文件

> 详见 `../../generated/tsconfig/`
