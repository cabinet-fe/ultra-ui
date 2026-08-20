# @cat-kit/tsconfig

共享 TypeScript 预设（JSON），非编程 API。

**版本**：2.0.1  
**Peer**：`typescript >= 6.0.0`

## 预设选择

| 文件 | 用途 |
| --- | --- |
| `tsconfig.json` | 基础共享选项 |
| `tsconfig.node.json` | Node.js 项目（建议另装 `@types/node`） |
| `tsconfig.bun.json` | Bun 项目（建议另装 `@types/bun`） |
| `tsconfig.web.json` | 浏览器 / 打包前端 |
| `tsconfig.vue.json` | Vue 项目（不继承 web 预设；需要浏览器 `lib` 时自行补充） |

## 用法

```json
{
  "extends": "@cat-kit/tsconfig/tsconfig.node.json"
}
```

```bash
bun add -d @cat-kit/tsconfig typescript
```

所有预设使用 ESM / bundler 解析；Node 预设未启用 `NodeNext`。镜像见 [generated/tsconfig/](../../generated/tsconfig/)。
