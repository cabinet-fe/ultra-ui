---
"@veltra/mobile": patch
---

重发 1.1.0 的修复版：此前发布流程跳过了 mobile 构建，发布产物缺少 `dist` 导致宿主 import 无法解析；本版本起 tarball 恢复携带 `dist`。
