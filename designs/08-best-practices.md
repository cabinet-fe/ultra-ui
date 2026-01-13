# 最佳实践 (Best Practices)

本文档汇总 Ultra UI 组件开发和使用的最佳实践。

## 样式开发

### 使用设计令牌

```scss
// ✅ 推荐
.component {
  color: fn.use-var(text-color, main);
  border-radius: fn.use-var(radius, default);
}

// ❌ 避免
.component {
  color: #606266;
  border-radius: 6px;
}
```

### 遵循 BEM 命名

```scss
// ✅ 推荐
@include m.b(button) {
  @include m.e(icon) {
  }
  @include m.m(primary) {
  }
  @include m.is(disabled) {
  }
}

// ❌ 避免
.btn {
}
.btn .icon {
}
.btn-primary {
}
```

### 使用 SCSS Mixins

```scss
// ✅ 推荐
@include m.size using ($size) {
  height: fn.use-var(form-component-height, $size);
}

// ❌ 避免
&--small {
  height: 24px;
}
&--default {
  height: 32px;
}
&--large {
  height: 40px;
}
```

## 组件开发

### Props 设计

```typescript
// ✅ 推荐：语义化命名
interface ButtonProps {
  size?: 'small' | 'default' | 'large'
  type?: 'primary' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  loading?: boolean
}

// ❌ 避免：含糊命名
interface ButtonProps {
  s?: number
  t?: string
  d?: boolean
}
```

### 事件命名

```typescript
// ✅ 推荐
const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  blur: [event: FocusEvent]
}>()

// ❌ 避免
const emit = defineEmits(['input', 'onchange'])
```

### 默认值处理

```typescript
// ✅ 推荐
const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  disabled: false
})

// 或使用计算属性处理默认值
const actualSize = computed(() => props.size ?? globalConfig.size)
```

## 性能优化

### 避免不必要的响应式

```typescript
// ✅ 推荐：静态数据不需要响应式
const OPTIONS = ['a', 'b', 'c'] as const

// ❌ 避免
const options = ref(['a', 'b', 'c'])
```

### 使用 shallowRef

```typescript
// ✅ 对大对象使用 shallowRef
const tableData = shallowRef<Item[]>([])
```

### 计算属性缓存

```typescript
// ✅ 推荐：使用计算属性
const filteredList = computed(() => list.value.filter(item => item.active))

// ❌ 避免：在模板中直接过滤
// <div v-for="item in list.filter(i => i.active)">
```

## 可维护性

### 单一职责

```typescript
// ✅ 推荐：功能拆分
function useFormValidation() {}
function useFormSubmit() {}

// ❌ 避免：巨型函数
function useForm() {
  /* 500行 */
}
```

### 类型定义

```typescript
// ✅ 推荐：明确类型
interface User {
  id: number
  name: string
  email: string
}

// ❌ 避免
const user: any = {}
```

### 注释规范

```typescript
// ✅ 推荐：解释"为什么"
// 使用 shallowRef 避免大数据的深度响应式开销
const data = shallowRef([])

// ❌ 避免：解释"是什么"
// 创建一个 ref
const data = ref([])
```

## 代码组织

### 组件文件结构

```
button/
├── index.ts          # 导出
├── button.vue        # 组件
├── button.ts         # Props/类型
├── style.scss        # 样式
└── helper.ts         # 辅助函数
```

### 导入顺序

```typescript
// 1. Vue 核心
import { ref, computed, watch } from 'vue'

// 2. 外部依赖
import { debounce } from 'cat-kit/fe'

// 3. 内部工具
import { useConfig } from '@ui/compositions'

// 4. 类型
import type { ButtonProps } from './button'
```

## 测试建议

### 单元测试

```typescript
describe('Button', () => {
  it('应渲染默认按钮', () => {
    const wrapper = mount(Button)
    expect(wrapper.classes()).toContain('u-button')
  })

  it('点击时应触发事件', async () => {
    const wrapper = mount(Button)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

### 可访问性测试

```typescript
it('应有正确的 ARIA 属性', () => {
  const wrapper = mount(Button, { props: { disabled: true } })
  expect(wrapper.attributes('aria-disabled')).toBe('true')
})
```

## 文档规范

### Props 文档

```typescript
/**
 * 按钮尺寸
 * @default 'default'
 */
size?: 'small' | 'default' | 'large'

/**
 * 是否禁用
 * @default false
 */
disabled?: boolean
```

### 示例代码

```vue
<!-- 基础用法 -->
<u-button>默认按钮</u-button>

<!-- 主要按钮 -->
<u-button type="primary">主要按钮</u-button>

<!-- 禁用状态 -->
<u-button disabled>禁用按钮</u-button>
```

## 检查清单

### 开发前

- [ ] 理解需求和设计稿
- [ ] 确定 Props 和事件接口
- [ ] 规划组件结构

### 开发中

- [ ] 使用设计令牌
- [ ] 遵循命名规范
- [ ] 处理边界情况
- [ ] 添加类型定义

### 开发后

- [ ] 编写测试用例
- [ ] 检查可访问性
- [ ] 验证暗色主题
- [ ] 补充文档
