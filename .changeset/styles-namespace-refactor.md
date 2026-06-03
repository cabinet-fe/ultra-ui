---
"@veltra/styles": patch
---

重构 SCSS 模块中 $namespace 变量的定义位置，将其从 _vars.scss 移至 _functions.scss 和 _mixins.scss，消除潜在的循环依赖问题
