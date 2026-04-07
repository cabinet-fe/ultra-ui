# 项目迁移

## 1. UI 迁移到 Monorepo 架构

UI 拆分为以下几个包：

- `@ultra-ui/desktop`：基础 PC 端组件
- `@ultra-ui/mobile`：基础移动端组件，暂时不会有， 先创建好包结构
- `@ultra-ui/icons`：图标库，暂时不会有，可以创建包结构，我已有图标 svg 文件，从别的项目迁移过来，后续将会替换 `@ultra/icon` 依赖
- `@ultra-ui/directives`：共享自定义指令
- `@ultra-ui/compositions`：共享组合式函数
- `@ultra-ui/utils`：共享工具函数

- `@ultra-ui/datasource`：数据源连接器 UI
- `@ultra-ui/report`：报表设计组件

## 2. cat-kit 迁移到 `@cat-kit/*` 系列包

使用 `use-cat-kit` 技能，将 `cat-kit` 迁移到 `@cat-kit/*` 系列包。

@cat-kit/core：核心包
@cat-kit/fe：浏览器端工具函数
@cat-kit/be：Node.js 工具函数
@cat-kit/maintenance：维护和构建工具
@cat-kit/cli：CLI 工具函数

## 3. 全面迁移到 oxc 全家桶

包括 oxlint, oxfmt 等。

## 4. 全面迁移到 typescript 6.x 版本

@cat-kit/tsconfig 2.x 版本支持 typescript 6.x 版本，使用这个库来扩展 tsconfig.json 文件。

务必使用基于 ts 6.x 的 monorepo 最佳实践，尤其是性能这一块，要好好地定义 tsconfig.json 文件。


## 5. 评估当前主题系统、样式预处理器是否需要调整？

仔细评估当前主题系统、样式预处理器是否需要调整？我希望可以更加现代化地配置主题，更加优雅地使用 css 变量。

## 6. 更新依赖版本

确保所有依赖的版本都是最新的，禁止使用过期依赖。