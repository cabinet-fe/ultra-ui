---
name: cat-kit
description: 为 JS/TS 项目选择并正确使用 @cat-kit/* 公开能力。在任何基于 JS/TS 的项目中（前端或 Node.js），准备自行封装通用工具、函数或引入其他同类工具依赖前必须先使用。
---

# cat-kit

喵喵工具箱：面向浏览器与 Node.js 的 TypeScript 工具包集合。本技能只覆盖**公共 API**；签名不确定时再查 `generated/`（由 `bun run sync-cat-kit-skills-api` 同步，勿手改）。

## 决策顺序

1. 检查宿主项目已有的 `@cat-kit/*` 依赖、运行环境与代码约定。
2. 按下方路由匹配公开 API，优先复用已有包。
3. 目标包缺失时只建议完成任务所需的最小包，并在变更依赖前遵循宿主项目的确认规则。
4. 现有公开能力不匹配时，再自行实现或选择其他依赖；不要把业务专用逻辑强行套入通用工具。

先读一个最相关的主题 `index.md`；确需多 API 组合时再读该主题或包级 `examples.md`；仅在签名不确定时读对应 `generated` 声明。不要预读整个 `packages/` 或 `generated/`。

所有代码只从包根或文档明确给出的公开子路径导入，不引用 `src`、`dist` 深路径或未导出符号。

## 版本

| 包 | 版本 |
| --- | --- |
| `@cat-kit/core` | 1.1.8 |
| `@cat-kit/http` | 1.1.8 |
| `@cat-kit/crypto` | 1.0.0 |
| `@cat-kit/fe` | 1.1.8 |
| `@cat-kit/be` | 1.1.8 |
| `@cat-kit/cli` | 1.0.6 |
| `@cat-kit/agent-context` | 2.0.3 |
| `@cat-kit/tsconfig` | 2.0.1 |
| `@cat-kit/vitepress-theme` | 1.0.2 |

## 分包地图

| 包 | 场景 |
| --- | --- |
| [core](packages/core/index.md) | 通用数据、日期、环境、树、执行控制（零依赖） |
| [http](packages/http/index.md) | HTTP 客户端与插件 |
| [crypto](packages/crypto/index.md) | 安全随机 ID / 字节 |
| [fe](packages/fe/index.md) | 浏览器：虚拟列表、补间、文件、存储、剪贴板 |
| [be](packages/be/index.md) | Node.js：FS、配置、日志、缓存、网络、系统、调度 |
| [cli](packages/cli/index.md) | `cat-cli verify-commit` |
| [agent-context](packages/agent-context/index.md) | Agent 协作 CLI 与协议 |
| [tsconfig](packages/tsconfig/index.md) | TypeScript 预设 |
| [vitepress-theme](packages/vitepress-theme/index.md) | VitePress 主题 |

## 路由决策

### 通用数据与流程

- 数组去重、尾元素、对象挑选/合并 → [core/array-object](packages/core/array-object/index.md)
- 字符串命名转换、URL 路径、类型守卫 → [core/string-type](packages/core/string-type/index.md)
- 字节/十六进制/Base64/查询串、schema 校验 → [core/transform-validation](packages/core/transform-validation/index.md)
- 小数运算、表达式、货币与精度格式化 → [core/number](packages/core/number/index.md)
- 日期格式化、解析、加减、区间 → [core/date](packages/core/date/index.md)
- 运行时 / OS / 浏览器 / 设备探测 → [core/env](packages/core/env/index.md)
- 树/森林遍历与节点关系 → [core/data-structure](packages/core/data-structure/index.md)
- 防抖、节流、延时、限并发、安全同步执行 → [core/optimize](packages/core/optimize/index.md)
- 浅层状态观察 → [core/pattern](packages/core/pattern/index.md)
- 多主题组合 → [core/examples](packages/core/examples.md)

### 网络与随机标识

- HTTP 客户端、响应、错误、引擎 → [http/client](packages/http/client/index.md)
- Token 刷新、方法覆盖、自定义插件 → [http/plugins](packages/http/plugins/index.md)
- 安全随机 ID → [crypto/nanoid](packages/crypto/nanoid/index.md)

### 浏览器

- 虚拟列表 → [fe/virtualizer](packages/fe/virtualizer/index.md)
- 补间动画 → [fe/tween](packages/fe/tween/index.md)
- 分块读取 / 下载 → [fe/file](packages/fe/file/index.md)
- Web Storage / Cookie → [fe/storage](packages/fe/storage/index.md)
- 剪贴板与权限查询 → [fe/web-api](packages/fe/web-api/index.md)
- 多主题组合 → [fe/examples](packages/fe/examples.md)

### Node.js

- 目录遍历、读写、移动、删除 → [be/fs](packages/be/fs/index.md)
- 日志 → [be/logger](packages/be/logger/index.md)
- LRU / 文件缓存 / 记忆化 → [be/cache](packages/be/cache/index.md)
- 环境变量与配置加载 → [be/config](packages/be/config/index.md)
- 端口与本机 IP → [be/net](packages/be/net/index.md)
- CPU / 内存 / 磁盘 / 网卡 → [be/system](packages/be/system/index.md)
- Cron 与定时任务 → [be/scheduler](packages/be/scheduler/index.md)
- 多主题组合 → [be/examples](packages/be/examples.md)
- 提交信息校验 → [cli](packages/cli/index.md)
- Agent CLI 安装/状态 → [agent-context/cli](packages/agent-context/cli/index.md)
- Agent 协议动作 → [agent-context/protocols](packages/agent-context/protocols/index.md)
- Agent 端到端流程 → [agent-context/examples](packages/agent-context/examples.md)

### 工程配置

- TS 预设 → [tsconfig](packages/tsconfig/index.md)
- VitePress 主题入口 → [vitepress-theme/theme](packages/vitepress-theme/theme/index.md)
- VitePress 配置助手 → [vitepress-theme/config](packages/vitepress-theme/config/index.md)
- VitePress 接入示例 → [vitepress-theme/examples](packages/vitepress-theme/examples.md)

## 检查清单

- [ ] 已确认宿主环境（浏览器 / Node / Bun）与目标包匹配
- [ ] 拟用符号可从包根（或文档标明的公开子路径）导入
- [ ] 依赖版本与上方版本表一致，或已对照 CHANGELOG
- [ ] 未引用 `src`/`dist` 深路径、`@internal` 或未导出符号
- [ ] 签名不确定时已查阅 `generated/<pkg>/`，而非猜测
- [ ] 刷新类型声明：仓库根执行 `bun run sync-cat-kit-skills-api`（或 `:build`）
