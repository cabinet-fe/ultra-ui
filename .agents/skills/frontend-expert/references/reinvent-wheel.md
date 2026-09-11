# 造轮子与乱加依赖

先复用项目能力，再考虑新库。

## 反例：已有 dayjs / 项目 util 仍新装库

```bash
npm i date-fns
```

```ts
import { format } from 'date-fns'
format(date, 'yyyy-MM-dd')
```

项目已有：

```ts
import { formatDate } from '@/utils/date'
formatDate(date, 'YYYY-MM-DD')
```

## 正例

```ts
import { formatDate } from '@/utils/date'
formatDate(date, 'YYYY-MM-DD')
```

## 反例：随手写一份新 util（项目已有）

```ts
// src/utils/formatMoney.ts（新建）
export function formatMoney(n: number) {
  return n.toFixed(2)
}
```

已有 `@/utils/number` 的 `formatAmount` 时，禁止再造。

## 正例

```ts
import { formatAmount } from '@/utils/number'
```

## 反例：忽略已安装的 Agent Skill

需要按团队表格组件 API 写页面，却凭训练记忆自创 props；项目已安装对应库的 Skill 时，应先读 Skill 再写。

## 正例流程

1. 搜 `utils` / `helpers` / 同名函数  
2. 查 `package.json` 是否已有 dayjs、lodash-es、等  
3. 查已安装 Skill 是否覆盖该库  
4. 仍不够 → 用现有依赖的 API；若要新 npm，先问用户  

## 允许新建 util 的条件

- 搜过确认不存在；
- 逻辑在本处已重复或即将多处使用；
- 不引入新依赖，或用户已批准新依赖。
