---
'@veltra/desktop': patch
---

file-viewer 的 OFD 预览内核改为内置打包：`@veltra/ofd-core` 不再对外发版，从 optional peer 调整为 desktop 的 `devDependencies`（workspace 协议）并随包打包，下游无需安装，OFD 预览开箱即用。
