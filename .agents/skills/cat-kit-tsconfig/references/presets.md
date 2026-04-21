# tsconfig — 预设一览

**权威内容**：与本包 npm `files` 一致的 JSON 镜像在 [`generated/`](../generated/)。

| 文件                                                    | 典型用途                         |
| ------------------------------------------------------- | -------------------------------- |
| [`tsconfig.node.json`](../generated/tsconfig.node.json) | Node.js 库 / 脚本                |
| [`tsconfig.web.json`](../generated/tsconfig.web.json)   | 浏览器 / 前端                    |
| [`tsconfig.bun.json`](../generated/tsconfig.bun.json)   | Bun 运行时                       |
| [`tsconfig.vue.json`](../generated/tsconfig.vue.json)   | Vue 单文件组件                   |
| [`tsconfig.json`](../generated/tsconfig.json)           | 包内基础入口（可被其它预设继承） |

安装后在本项目 `tsconfig.json` 中通过 `extends` 引用，例如：`"@cat-kit/tsconfig/tsconfig.node.json"`（具体路径以包解析为准）。
