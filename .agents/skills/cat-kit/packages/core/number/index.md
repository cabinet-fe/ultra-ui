# core — 数值

## 何时使用

小数运算、表达式求值、货币/精度格式化、范围与遍历。

## 推荐公开 API

- `$n.plus|minus|sum(...numberOrString)`、`$n.mul|div(a, b)`、`$n.calc(expression)`、`$n.formatter(options)`
- `n(value)`：`.currency`、`.fixed`、`.each`、`.range`、`.max`、`.min`

```ts
import { $n, n } from '@cat-kit/core'

$n.plus(0.1, 0.2) // 0.3
$n.calc('(1+2)*3')
n(1234.56).currency('CNY')
```

详情见 [apis.md](apis.md)。

## 约束

- 结果仍是 JS `number`；大数字符串可减少中间精度损失
- `$n.calc` 仅支持数字字面量、科学计数、`+ - * /`、括号与一元正负，无变量
- `currency`/`fixed` 返回字符串；`range` 会规范化反转边界

## 类型入口

[number.d.ts](../../../generated/core/data/number.d.ts) · [num.d.ts](../../../generated/core/data/number/num.d.ts) · [format.d.ts](../../../generated/core/data/number/format.d.ts)
