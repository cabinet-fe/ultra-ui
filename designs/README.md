# Ultra UI 设计规范

本目录包含 Ultra UI 组件库的设计规范文档。

## 📁 目录结构

```
designs/
├── README.md                    # 本文件
├── 01-design-tokens.md          # 设计令牌规范
├── 02-typography.md             # 排版规范
├── 03-colors.md                 # 颜色规范
├── 04-spacing.md                # 间距规范
├── 05-components.md             # 组件设计指南
├── 06-motion.md                 # 动效规范
├── 07-accessibility.md          # 可访问性规范
├── 08-best-practices.md         # 最佳实践
└── preview/                     # 可交互预览
    └── index.html               # 设计规范预览页面
```

## 🎯 设计原则

Ultra UI 遵循以下核心设计原则：

### 1. 清晰 (Clarity)

- 信息层次分明，用户能快速理解界面
- 使用一致的视觉语言减少认知负担

### 2. 高效 (Efficiency)

- 减少用户操作步骤
- 提供快捷操作和智能默认值

### 3. 一致 (Consistency)

- 组件行为和视觉风格保持统一
- 遵循平台惯例和用户预期

### 4. 包容 (Inclusive)

- 考虑不同能力用户的使用需求
- 确保足够的颜色对比度和可访问性

## 🚀 快速开始

1. 阅读[设计令牌规范](./01-design-tokens.md)了解基础设计系统
2. 查看[颜色规范](./03-colors.md)和[排版规范](./02-typography.md)
3. 参考[组件设计指南](./05-components.md)进行组件开发
4. 打开 `preview/index.html` 查看可交互的设计规范预览

## 📐 设计系统概览

| 维度     | 规范                                        |
| -------- | ------------------------------------------- |
| 尺寸体系 | small / default / large                     |
| 颜色类型 | primary / success / warning / danger / info |
| 圆角体系 | 4px / 6px / 8px                             |
| 间距基数 | 4px (基于 4 的倍数)                         |
| 字体     | Inter + 系统中文字体                        |

## 🎨 主题支持

Ultra UI 支持亮色和暗色两种主题，所有设计令牌都通过 CSS 变量实现，便于主题切换。

---

_最后更新: 2026-01-13_
