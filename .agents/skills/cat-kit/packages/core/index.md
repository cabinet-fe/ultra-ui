# @cat-kit/core

零依赖核心工具包，提供数组、对象、树、日期、环境检测、检测模式、性能优化等通用工具。浏览器与 Node.js 均可使用。

## 运行环境

通用（浏览器与 Node.js 均可，无内置 Node 专用 API 依赖）。

## API 分类

| 分类 | 文档 | 说明 |
|------|------|------|
| 数据处理 | [data.md](data.md) | 数组并集/交集/去重、对象合并/深层合并、集合操作 |
| 数据结构 | [data-structure.md](data-structure.md) | TreeManager 树管理器、LRU 缓存等 |
| 日期工具 | [date.md](date.md) | 日期格式化、相对时间、时间戳转换 |
| 环境检测 | [env.md](env.md) | 运行时环境检测（浏览器/Node.js/Bun 等） |
| 性能优化 | [optimize.md](optimize.md) | 节流/防抖、惰性求值、记忆化 |
| 设计模式 | [pattern.md](pattern.md) | Observer 观察者模式等常用设计模式实现 |
| 高精度运算 | [examples.md](examples.md) | `$n` 高精度数学运算示例 |

## 类型签名

> 详见 `../../generated/core/index.d.ts`
