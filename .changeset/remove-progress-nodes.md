---
"@veltra/desktop": minor
---

移除 `UProgressNodes` 进度节点组件及其类型与样式导出，横向步骤进度场景改用 `USteps`。

```vue
<!-- 旧 -->
<u-progress-nodes :nodes="nodes" />

<!-- 新 -->
<u-steps :steps="steps" />
```
